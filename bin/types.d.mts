export interface config {
    'episode-folder': string;
    'page-folder': string;
    'vtt-folder': string;
    defaults: {
        interviewer: Array<string>;
    };
}
export interface episode {
    itunesEpisodeUrl: string;
    interviewee: Array<string>;
}
