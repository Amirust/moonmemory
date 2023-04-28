import { exec } from 'child_process';
export default async function executeShell( command: string ): Promise<string>
{
	return new Promise( ( resolve, reject ) => exec( command, ( error, stdout, stderr ) => error && reject( error ) || stderr && reject( stderr ) || resolve( stdout ) ) );
}