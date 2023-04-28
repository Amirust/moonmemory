export default function chunk( str: any[], size: number )
{
	return Array.from( { length: Math.ceil( str.length / size ) }, ( _, n ) => str.slice( n * size, n * size + size ) );
}