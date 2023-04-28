import fs from 'fs/promises';
import crypto from 'node:crypto';
import { Exporter, ExporterType } from '@MoonMemory/types/Exporter.js';
import { ResultToExport } from '@MoonMemory/types/IChecker.js';

export default class TxtMultifileExporter implements Exporter
{
	name = 'TXT (Много файловый)';
	type = ExporterType.TXT_MultipleFiles;

	async export( data: ResultToExport, path: string ): Promise<void>
	{
		const dir = `${path}/export_${crypto.randomBytes( 8 ).toString( 'hex' )}_${new Date().toLocaleDateString( 'ru' )}`;
		await fs.mkdir( dir );

		for ( const token of data.tokensValid )
		{
			await fs.appendFile( `${dir}/valid.txt`, token + '\n' );
		}

		for ( const billingToken of data.tokensBilling )
		{
			await fs.appendFile( `${dir}/billing.txt`,
				`${billingToken.token}\n` +
				`${billingToken.payments.map( method => `[${method.country}] ${method.brand}\n${method.last_4} ${method.expire_month}/${method.expire_year}` ).join( '\n' )}\n\n`
			);
		}

		for ( const phone of data.tokensPhones )
		{
			await fs.appendFile( `${dir}/phones.txt`, phone + '\n' );
		}

		for ( const token of data.tokensSpammed )
		{
			await fs.appendFile( `${dir}/spammed.txt`, token + '\n' );
		}

		const notSpammed = data.tokensValid.filter( token => !data.tokensSpammed.includes( token ) );

		for ( const token of notSpammed )
		{
			await fs.appendFile( `${dir}/notSpammed.txt`, token + '\n' );
		}

		return;
	}
}