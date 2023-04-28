import fs from 'fs';

function writeFile( path: string, data: string, override: boolean = false ): void
{
	if ( fs.existsSync( path ) && !override ) throw new Error( 'File already exists' );
	else if ( fs.existsSync( path ) && override ) fs.unlinkSync( path );
    
	fs.writeFileSync( path,  data,{ encoding: 'utf-8' } );
}

function createDirIfNotExists( path: string ): void
{
	if ( !fs.existsSync( path ) ) fs.mkdirSync( path );
}

function appendFile( path: string, data: string ): void
{
	fs.appendFileSync( path, data, { encoding: 'utf-8' } );
}

export {
	writeFile,
	createDirIfNotExists,
	appendFile
};