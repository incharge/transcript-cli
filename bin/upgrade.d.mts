import { config } from './types.mjs';
export interface episodeOut {
    episodeid: string;
    id?: string;
}
export declare function gitMvYamlJson(config: config): Promise<void>;
export declare function idToEpisodeId(config: config): Promise<void>;
