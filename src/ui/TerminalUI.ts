import fs from 'fs';
import inquirer from 'inquirer';
import piscina from 'piscina';
import chalk from 'chalk';
import { MessageChannel } from 'worker_threads';
import cliProgress, { SingleBar } from 'cli-progress';
import path from 'node:path';
import { Loader,AsyncLoader } from '@MoonMemory/types/Loader.js';
import { LoaderInputType } from '@MoonMemory/types/LoaderInputType.js';
import { defaultParams, checks as checklist, ThreadResult, toCheck } from '@MoonMemory/types/IChecker.js';
import { createDirIfNotExists, writeFile } from '@MoonMemory/utils/fsUtils.js';
import { info, success } from '@MoonMemory/utils/logger.js';
import getPhysicalCpusCount from '@MoonMemory/utils/getPhysicalCpusCount.js';
import chunk from '@MoonMemory/utils/chunk.js';
import { ProxyProvider } from '@MoonMemory/types/Proxy.js';
import { Exporter } from '@MoonMemory/types/Exporter.js';

function formatbar( progress: number, options: cliProgress.Options ): string
{
	if ( !options.barsize || !options.barCompleteString || !options.barIncompleteString ) return '';

	const completeSize = Math.round( progress * options.barsize );
	const incompleteSize = options.barsize - completeSize;
	return `${chalk.green( options.barCompleteString.substring( 0, completeSize ) )}${options.barGlue}${chalk.red( options.barIncompleteString.substring( 0, incompleteSize ) )}`;
}
export default class TerminalUI
{
	public static async getLoaders(): Promise<Array<AsyncLoader|Loader>>
	{
		const files = fs.readdirSync( './dist/loaders' );
		const loaders: Loader[]|AsyncLoader[] = [];
		for ( const file of files )
		{
			if ( file.endsWith( '.js' ) )
			{
				const loader = ( await import( `../loaders/${file}` ) ).default;
				loaders.push( new loader() );
			}
		}

		return loaders;
	}

	public static async getProxyProviders(): Promise<ProxyProvider[]>
	{
		const files = fs.readdirSync( './dist/proxy-providers' );
		const providers: ProxyProvider[] = [];
		for ( const file of files )
		{
			if ( file.endsWith( '.js' ) )
			{
				const provider = ( await import( `../proxy-providers/${file}` ) ).default;
				providers.push( new provider() );
			}
		}

		return providers;
	}

	public static async getExporters(): Promise<Exporter[]>
	{
		const files = fs.readdirSync( './dist/exporters' );
		const exporters: Exporter[] = [];
		for ( const file of files )
		{
			if ( file.endsWith( '.js' ) )
			{
				const exporter = ( await import( `../exporters/${file}` ) ).default;
				exporters.push( new exporter() );
			}
		}
		return exporters;
	}

	public static async start( oldParams?: defaultParams, fastStart: boolean = false ): Promise<void>
	{
		const loaders = await this.getLoaders();
		const providers = await this.getProxyProviders();
		const exporters = await this.getExporters();

		let selectedLoader: Loader | AsyncLoader;
		let selectedProvider: ProxyProvider;
		let selectedExporter: Exporter;
		let promptSource: string;
		let checks: toCheck[];

		if ( !fastStart ) 
		{
			const { promptLoader } = await inquirer.prompt( [{
				type: 'list',
				name: 'promptLoader',
				message: 'Выберите тип загрузки',
				choices: loaders.map( loader => loader.name )
			}] );

			selectedLoader = loaders.find( ( loader: Loader | AsyncLoader ) => loader.name === promptLoader )!;

			const { promptProxyProvider } = await inquirer.prompt( [{
				type: 'list',
				name: 'promptProxyProvider',
				message: 'Выберите провайдера прокси',
				choices: providers.map( provider => provider.name )
			}] );

			selectedProvider = providers.find( ( provider: ProxyProvider ) => provider.name === promptProxyProvider )!;

			const { promptExporter } = await inquirer.prompt( [{
				type: 'list',
				name: 'promptExporter',
				message: 'Выберите экспортер',
				choices: exporters.map( exporter => exporter.name )
			}] );

			selectedExporter = exporters.find( ( exporter: Exporter ) => exporter.name === promptExporter )!;

			const { promptedSource } = await inquirer.prompt( [{
				type: 'input',
				name: 'promptedSource',
				message: selectedLoader!.inputType === LoaderInputType.Directory ? 'Введите путь к папке' : 'Введите путь к файлу',
				validate: ( input: string ) => fs.existsSync( input ) ? true : 'Путь не существует'
			}] );
			promptSource = path.resolve( promptedSource );

			const { promptedChecks } = await inquirer.prompt( [{
				type: 'checkbox',
				name: 'promptedChecks',
				message: 'Выберите на что проверять',
				choices: checklist
			}] );
			checks = promptedChecks!;

			writeFile( 'default_params.json', JSON.stringify( {
				loader: selectedLoader!.name,
				proxyProvider: selectedProvider!.name,
				source: promptSource,
				exporter: selectedExporter!.name,
				checks
			} as defaultParams ), true );

			info( 'Параметры сохранены в default_params.json' );
		}
		else 
		{
			selectedLoader = loaders.find( ( loader: Loader | AsyncLoader ) => loader.name === oldParams!.loader )!;
			selectedProvider = providers.find( ( provider: ProxyProvider ) => provider.name === oldParams!.proxyProvider )!;
			promptSource = oldParams!.source;
			selectedExporter = exporters.find( ( exporter: Exporter ) => exporter.name === oldParams!.exporter )!;
			checks = oldParams!.checks;
		}

		const proxy = await selectedProvider!.load();
		info( `Загружено ${selectedProvider.proxies.length} прокси` );
		const tokens = await selectedLoader!.load( promptSource );
		const piscinaInstance = new piscina( {
			filename: './dist/checker/worker.js'
		} );
		const cpusCount = await getPhysicalCpusCount();

		const { chunkSize } = await inquirer.prompt( [{
			type: 'number',
			name: 'chunkSize',
			message: `Найдено токенов: ${[...new Set( tokens )].length} / Количество токенов в чанке (Рекомендуемо: ${Math.ceil( Math.abs( [...new Set( tokens )].length / cpusCount ) )})?`,
		}] );

		const chunks = chunk( [...new Set( tokens )], chunkSize );
		const multibar = new cliProgress.MultiBar( {
			clearOnComplete: true,
			hideCursor: true,
			barGlue: '',
			formatBar: formatbar,
			format: `{bar} {percentage}% | {value}/{total} | ${chalk.yellowBright( 'THREAD {id}' )}`,
			barCompleteChar: '━',
			barIncompleteChar: '━'
		} );

		const resolvedChunks: ThreadResult[] = [];
		let valid = 0,
			billing = 0,
			id = 0,
			errors = 0,
			phones = 0,
			spam = 0,
			invalids = 0;

		const bars: SingleBar[] = [];
		for ( let i = 0; i < chunks.length; i++ )
		{
			bars.push( multibar.create( chunks[i].length, 0, {
				id: i
			} ) );
		}

		await Promise.all( chunks.map( async chunk => 
		{
			id++;
			const channel = new MessageChannel();
			channel.port2.on( 'message', ( message ) => 
			{
				if ( !bars[message.id] ) return;
				bars[message.id].update( message.resolved );
			} );
			await piscinaInstance.run( { chunk, proxy: selectedProvider, id, checklist: checks, port: channel.port1 }, { transferList: [channel.port1] } )
				.catch( console.error )
				.then( res => { resolvedChunks.push( res ); }
				);
		} ) );


		multibar.stop();
		piscinaInstance.destroy();


		for ( const chunk of resolvedChunks )
		{
			errors += chunk.errors;
			invalids += chunk.invalids;
			valid += chunk.tokensValid.length;
			billing += chunk.tokensBilling.length;
			phones += chunk.tokensPhones.length;
			spam += chunk.tokensSpammed.length;
		}

		createDirIfNotExists( './output' );
		await selectedExporter.export( {
			tokensValid: resolvedChunks.map( chunk => chunk.tokensValid ).flat(),
			tokensBilling: resolvedChunks.map( chunk => chunk.tokensBilling ).flat(),
			tokensPhones: resolvedChunks.map( chunk => chunk.tokensPhones ).flat(),
			tokensSpammed: resolvedChunks.map( chunk => chunk.tokensSpammed ).flat(),
		}, './output' );

		success( 'Проверка завершена!' );
		console.log( chalk.green(
			`✅ Валид: ${valid}\n` +
			`📞 С телефоном: ${phones}\n` +
			`💳 Привязанные карты: ${billing}`
		) );
		console.log( chalk.yellow( `📵 Спам: ${spam}` ) );
		console.log( chalk.red( `❌ Невалид: ${invalids}\n⛔ Ошибок: ${errors}\n` ) );
		console.log( '\n      Соотношение Валид / Невалид' );
		new cliProgress.SingleBar( {
			hideCursor: true,
			barGlue: '',
			formatBar: formatbar,
			format: '{bar}',
			barCompleteChar: '━',
			barIncompleteChar: '━'
		} ).start( invalids, valid );

		process.exit( 0 );
	}
}