import { LoaderInputType } from './LoaderInputType.js';

interface Loader {
    name: string;
    inputType: LoaderInputType
    load( source: string ): string[];
}

interface AsyncLoader {
    name: string;
    inputType: LoaderInputType
    load( source: string ): Promise<string[]>;
}

export {
	Loader,
	AsyncLoader
};