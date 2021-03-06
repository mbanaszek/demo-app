import { Table } from "react-bootstrap";
import React, { FunctionComponent } from "react";
import Image from "react-bootstrap/Image";
import { useQuery } from "@apollo/client";

import {
    ContributorStats,
    createContributorsStatisticsQuery
} from "../graphql/contributorsStatistics";
import { Loader } from "./Loader";
import { isNil, isNotNil } from "../functional/logic";
import { ErrorMessage } from "./ErrorMessage";
import { RepositoryDetails } from "../graphql/repositoryDetails";

interface ContributorsStatsTableProps {
    repositoryDetails: RepositoryDetails;
}

export const ContributorsStatsTable: FunctionComponent<ContributorsStatsTableProps> = ({
    repositoryDetails
} : ContributorsStatsTableProps): JSX.Element => {
    const { loading, error, data } = useQuery(createContributorsStatisticsQuery(repositoryDetails));

    if (loading) return <Loader/>;

    if (isNotNil(error)) return <ErrorMessage text={isNil(error.networkError) ? error.message : "Network problems."}/>;

    if (isNil(data) || isNil(data.contributorsStats)) return <EmptyContributorsStatsTable/>;

    const sortedContributedStats = isNotNil(data.contributorsStats) ? sortStatsByHighestTotalChanges(data.contributorsStats) : [];
    return (
        <StatsTable>
            { sortedContributedStats.map((contributorStats, index) => (
                <tr key={contributorStats.name}>
                    <td>{index + 1}.</td>
                    <td>
                        <Image src={contributorStats.avatarUrl} thumbnail width={"150 px"}/>
                    </td>
                    <td>{contributorStats.name}</td>
                    <td className={"text-right"}>
                        <span className={"text-success"}>+ {contributorStats.additions} additions</span>
                    </td>
                    <td className={"text-right"}>
                        <span className={"text-danger"}>- {contributorStats.deletions} deletions</span>
                    </td>
                    <td className={"text-right"}>
                        <span className={"text-info"}>{contributorStats.additions + contributorStats.deletions} updates</span>
                    </td>
                </tr>
            ))
            }
        </StatsTable>
    );
};

export const EmptyContributorsStatsTable: FunctionComponent = (): JSX.Element => (
    <StatsTable>
        <tr>
            <td colSpan={6}>Please provide a valid GitHub repository URL.</td>
        </tr>
    </StatsTable>
);

interface StatsTableProps {
    children: React.ReactNode;
}
export const StatsTable: FunctionComponent<StatsTableProps> = ({ children }: StatsTableProps): JSX.Element => (
    <Table striped bordered hover>
        <thead>
            <tr>
                <th>#</th>
                <th></th>
                <th>Name</th>
                <th></th>
                <th></th>
                <th className={"text-right"}>Total score</th>
            </tr>
        </thead>
        <tbody>
            {children}
        </tbody>
    </Table>
);

const sortStatsByHighestTotalChanges = (stats: ContributorStats[]): ContributorStats[] => {
    return stats.slice().sort((
        firstStats,
        secondStats
    ) => {
        const firstTotalChanges = firstStats.additions + firstStats.deletions;
        const secondTotalChanges = secondStats.additions + secondStats.deletions;
        return secondTotalChanges - firstTotalChanges;
    });
};

