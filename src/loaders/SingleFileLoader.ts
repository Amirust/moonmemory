import * as fs from 'fs';
import { Loader } from '@MoonMemory/types/Loader.js';
import { LoaderInputType } from '@MoonMemory/types/LoaderInputType.js';
import { getNativeTokenInfo } from '@MoonMemory/utils/getNativeTokenInfo.js';

function processFile( path: string ): string[]
{
	const data = fs.readFileSync( path, 'utf8' );
	return [...data.toString().matchAll( /(mfa\.[\w_\-]{84})|([\w]{24}\.[\w_\-]{6}\.[\w_\-]{27})/g )]
		.map( m => m[0] as string )
		.filter( ( token: string ) => token && token.length > 1 )
		.filter( ( token: string ) => getNativeTokenInfo( token ).is_discord_token );
}

export default class SingleFileLoader implements Loader
{
	inputType = LoaderInputType.File;
	name = 'Загрузка с файла (Файл)';

	load( source: string ): string[]
	{
		return processFile( source );
	}

}