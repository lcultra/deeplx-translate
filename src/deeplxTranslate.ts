
import axios from 'axios';

import { workspace } from 'vscode';
import { ITranslate, ITranslateOptions } from 'comment-translate-manager';

const PREFIX_CONFIG = 'deeplxTranslate';

const langMaps: Map<string, string> = new Map([
    ['zh-CN', 'ZH'],
    ['zh-TW', 'ZH'],
]);

function convertLang(src: string) {
    if (langMaps.has(src)) {
        return langMaps.get(src);
    }
    return src.toLocaleUpperCase();
}

export function getConfig<T>(key: string): T | undefined {
    let configuration = workspace.getConfiguration(PREFIX_CONFIG);
    return configuration.get<T>(key);
}

export type DeepLXPreserveFormatting = '0' | '1';
export type DeepLXFormality = "default" | "more" | "less";


interface DeepLXTranslateOption {
    apiUrl: string;
}

interface Response {
  code: number;
  id: number;
  data: string;
  alternatives: string[];
}

export class DeepLXTranslate implements ITranslate {
    get maxLen(): number {
        return 3000;
    }

    private _defaultOption: DeepLXTranslateOption;
    constructor() {
        this._defaultOption = this.createOption();
        workspace.onDidChangeConfiguration(async eventNames => {
            if (eventNames.affectsConfiguration(PREFIX_CONFIG)) {
                this._defaultOption = this.createOption();
            }
        });
    }

    createOption() {
        const defaultOption: DeepLXTranslateOption = {
            apiUrl: getConfig<string>('apiUrl'),
        };
        return defaultOption;
    }

    async translate(content: string, {from, to}: ITranslateOptions) {
        if(!this._defaultOption.apiUrl) {
            throw new Error('请前往设置填写apiUrl');
        }
        const url = this._defaultOption.apiUrl;        
        const data = {
            text: content,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            source_lang: "EN",
            // eslint-disable-next-line @typescript-eslint/naming-convention
            target_lang: "ZH",
        };

        const res = await axios.post<Response>(url, data);

        if (res.data.code !== 200) {
            throw new Error('Server error!');
        }
        return res.data.data ?? content;
    }


    link(content: string, { to = 'auto' }: ITranslateOptions) {
        let str = `https://www.deeplx.com/translator#auto/${convertLang(to)}/${encodeURIComponent(content)}`;
        return `[DeepLX](${str})`;
    }

    isSupported(src: string) {
        return true;
    }
}




