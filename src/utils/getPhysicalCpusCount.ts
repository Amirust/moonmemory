import os from 'os';
import executeShell from '@MoonMemory/utils/executeShell.js';

export default async function getPhysicalCpusCount(): Promise<number>
{
	switch ( process.platform ) 
	{
	case 'win32':
		return ( await executeShell( 'WMIC CPU Get NumberOfCores' ) ).split( os.EOL ).map( line => +line ).filter( line => !isNaN( line ) ).reduce( ( a, b ) => a + b );

	case 'linux':
		return parseInt( ( await executeShell( 'lscpu -p | egrep -v "^#" | sort -u -t, -k 2,4 | wc -l' ) ).trim(), 10 );

	case 'darwin':
		return parseInt( ( await executeShell( 'sysctl -n hw.physicalcpu' ) ).trim(), 10 );

	default:
		return os.cpus().filter( ( cpu, index ) =>
		{
			return !cpu.model.includes( 'Intel' ) || index % 2 === 1;
		} ).length;
	}
}