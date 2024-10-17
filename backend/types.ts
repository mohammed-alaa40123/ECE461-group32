/**
 * Represents a user within the system.
 */
export interface User {
    /**
     * Indicates whether the user possesses administrative privileges.
     */
    isAdmin: boolean;

    /**
     * The name of the user.
     */
    name: string;
}

/**
 * Contains authentication information for a user.
 */
export interface UserAuthenticationInfo {
    /**
     * The password associated with the user. According to the specification, this should be a "strong" password.
     */
    password: string;
}

/**
 * Represents a semantic version range.
 */
export type SemverRange = string;

/**
 * Contains metadata related to a package.
 * 
 * The "Name" and "Version" are used as a unique identifier pair when uploading a package.
 * The "ID" is used as an internal identifier for interacting with existing packages.
 */
export interface PackageMetadata {
    /**
     * A unique identifier for use with the /package/{id} endpoint.
     */
    ID?: PackageId;

    /**
     * The name of the package.
     */
    Name: PackageName;

    /**
     * The version of the package.
     */
    Version: string;
}

/**
 * Represents the data associated with a package.
 * 
 * This is a "union" type:
 * - On package upload, either Content or URL should be set. If both are set, a 400 error is returned.
 * - On package update, exactly one field should be set.
 * - On download, the Content field should be set.
 */
export interface PackageData {
    /**
     * The contents of the package. This is the zip file uploaded by the user, encoded as text using Base64 encoding.
     * 
     * This will be a zipped version of an npm package's GitHub repository, minus the ".git/" directory. It will, for example, include the "package.json" file that can be used to retrieve the project homepage.
     */
    Content?: string;

    /**
     * A JavaScript program (for use with sensitive modules).
     */
    JSProgram?: string;

    /**
     * The URL of the package (for use in public ingest).
     */
    URL?: string;
}

/**
 * Represents a package, including its data and metadata.
 */
export interface Package {
    data: PackageData;
    metadata: PackageMetadata;
}

/**
 * Represents a regular expression used for searching for a package by name and README content.
 */
export interface PackageRegEx {
    /**
     * A regular expression over package names and READMEs that is used for searching for a package.
     */
    RegEx: string;
}

/**
 * Represents the rating of a package.
 * 
 * If the Project 1 that you inherited does not support one or more of the original properties, denote this with the value "-1".
 */
export interface PackageRating {
    /**
     * The bus factor of the package.
     */
    BusFactor: number;

    /**
     * The correctness of the package.
     */
    Correctness: number;

    /**
     * The fraction of its dependencies that are pinned to at least a specific major+minor version, e.g., version 2.3.X of a package.
     * 
     * If there are zero dependencies, they should receive a 1.0 rating. If there are two dependencies, one pinned to this degree, then they should receive a 0.5 rating.
     */
    GoodPinningPractice: number;

    /**
     * The license score of the package.
     */
    LicenseScore: number;

    /**
     * The net score calculated from other seven metrics.
     */
    NetScore: number;

    /**
     * The fraction of project code that was introduced through pull requests with a code review.
     */
    PullRequest: number;

    /**
     * The ramp-up score of the package.
     */
    RampUp: number;

    /**
     * The responsiveness of the maintainer of the package.
     */
    ResponsiveMaintainer: number;
}

/**
 * Represents the name of a package.
 * 
 * - Names should only use typical "keyboard" characters.
 * - The name "*" is reserved. See the `/packages` API for its meaning.
 */
export type PackageName = string;

/**
 * Represents a query for a package by name and optional version range.
 */
export interface PackageQuery {
    /**
     * The name of the package.
     */
    Name: PackageName;

    /**
     * The version range of the package.
     */
    Version?: SemverRange;
}

/**
 * Represents a unique identifier for a package.
 */
export type PackageId = string;

/**
 * Represents one entry of the history of a package.
 */
export interface PackageHistoryEntry {
    /**
     * The action performed on the package.
     */
    Action: 'CREATE' | 'UPDATE' | 'DOWNLOAD' | 'RATE';

    /**
     * The date of activity using ISO-8601 Datetime standard in UTC format.
     */
    Date: string;

    /**
     * The metadata of the package at the time of the action.
     */
    PackageMetadata: PackageMetadata;

    /**
     * The user who performed the action.
     */
    User: User;
}

/**
 * Represents the offset used in pagination.
 */
export type EnumerateOffset = string;

/**
 * Represents an authentication token.
 * 
 * The specification permits you to use any token format you like. You could, for example, look into JSON Web Tokens ("JWT", pronounced "jots"): https://jwt.io.
 */
export type AuthenticationToken = string;

/**
 * Represents a request for authentication.
 */
export interface AuthenticationRequest {
    /**
     * Contains the secret information required for user authentication.
     */
    Secret: UserAuthenticationInfo;

    /**
     * Represents the user requesting authentication.
     */
    User: User;
}