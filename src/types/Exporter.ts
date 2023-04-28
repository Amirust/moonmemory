import { ResultToExport } from '@MoonMemory/types/IChecker.js';

enum ExporterType {
    JSON_SingleFile,
    TXT_SingleFile,
    TXT_MultipleFiles
}

interface Exporter {
    name: string;
    type: ExporterType;
    export( data: ResultToExport, path: string ): void;
}

export {
	ExporterType,
	Exporter
};