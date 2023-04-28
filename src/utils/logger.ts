import chalk from 'chalk';

const info = ( message: string ) => console.log( `${chalk.blueBright( '[i]' )} ${message}` );
const error = ( message: string ) => console.log( `${chalk.redBright( '[X]' )} ${message}` );
const success = ( message: string ) => console.log( `${chalk.greenBright( '[+]' )} ${message}` );

export {
	info,
	error,
	success
};