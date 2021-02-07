import { Octokit } from "@octokit/core";
import { Maybe } from "graphql/jsutils/Maybe";

import { isNil, isNotNil } from "../functional/logic";

const APIAuthenticationToken = `61698582015b6623e8925de5a0264934f61427ef`;

export type ContributorStats = {
    name: string;
    avatarUrl: string;
    additions: number;
    deletions: number;
};

export type ResponseData = {
    author: Maybe<{ login: string; avatar_url: string; }>;
    weeks: { a?: number; d?: number; }[];
}[];

export class RepositoryNotFound extends Error {}
export class CanNotFetchRepositoryStatistics extends Error {}

export const fetchRepositoryContributorsStats = async (
    repositoryOwnerLogin: string,
    repositoryName: string
): Promise<ContributorStats[]> => {

    const responseData = await fetchStatsFromAPI(repositoryOwnerLogin, repositoryName);

    const contributorsStatistics: ContributorStats[] = [];
    for (const contributorData of responseData) {
        if (isNil(contributorData.author)) continue;

        const totalAdditions = contributorData.weeks.reduce(
            (additions, data) => additions + (isNil(data.a) ? 0 : data.a),
            0
        );
        const totalDeletions = contributorData.weeks.reduce(
            (deletions, data) => deletions + (isNil(data.d) ? 0 : data.d),
            0
        );

        contributorsStatistics.push({
            name: contributorData.author.login,
            avatarUrl: contributorData.author.avatar_url,
            additions: totalAdditions,
            deletions: totalDeletions
        });
    }

    return contributorsStatistics;
}

const fetchStatsFromAPI = async (
    repositoryOwnerLogin: string,
    repositoryName: string
): Promise<ResponseData> => {
    const octokit = new Octokit({ auth: APIAuthenticationToken });

    let response;
    try {
        response = await octokit.request('GET /repos/{owner}/{repo}/stats/contributors', {
            owner: repositoryOwnerLogin,
            repo: repositoryName
        });
    } catch (error) {
        if (isNotNil(error.status) && error.status === 404) throw new RepositoryNotFound();

        // TODO: log the error.
        // console.error(JSON.stringify(error, null, 2));

        throw new CanNotFetchRepositoryStatistics();
    }

    if (response.status !== 200) throw new CanNotFetchRepositoryStatistics();

    return response.data;
}