import TerminalUI from './dist/ui/TerminalUI.js';
import oldParams from './default_params.json' assert { type: 'json' };
const processFlags = process.argv.slice( 2 );
TerminalUI.start( oldParams, processFlags.includes( '--fast' ) || processFlags.includes( '-f' ) );
