import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface GifMetadata {
    id: string;
    owner: Principal;
    blob: ExternalBlob;
    name: string;
    description: string;
}
export interface ScoreEntry {
    principal?: Principal;
    score: bigint;
    playerName: string;
}
export type AvatarType = {
    __kind__: "custom";
    custom: {
        blob: ExternalBlob;
        fileType: string;
    };
} | {
    __kind__: "preset";
    preset: bigint;
};
export interface RewardHistory {
    blockIndex: bigint;
    timestamp: bigint;
    amount: bigint;
}
export interface TurretData {
    id: string;
    level: bigint;
    experience: bigint;
    kills: bigint;
}
export interface PuffinProfile {
    bio: string;
    displayName: string;
    avatarType: AvatarType;
}
export enum GameMode {
    flightAdventure = "flightAdventure",
    puffinSlide = "puffinSlide",
    puffinTowerDefense = "puffinTowerDefense",
    fishFrenzy = "fishFrenzy",
    puffinColonyWars = "puffinColonyWars",
    puffinRescue = "puffinRescue",
    arcticSurf = "arcticSurf",
    puffinCatch = "puffinCatch"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimRewards(): Promise<{
        blockIndex: bigint;
        amount: bigint;
    }>;
    deleteCallerGif(id: string): Promise<{
        deleted: boolean;
    }>;
    getAccountID(): Promise<string>;
    getAllColonyWarsStats(): Promise<Array<[Principal, {
            totalResourcesEarned: bigint;
            totalTurretKills: bigint;
            turrets: Array<[string, TurretData]>;
            totalGames: bigint;
        }]>>;
    getAllGifs(): Promise<Array<GifMetadata>>;
    getAvatar(avatarType: AvatarType): Promise<Uint8Array | null>;
    getCallerPrincipal(): Promise<Principal>;
    getCallerUserProfile(): Promise<PuffinProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getColonyWarsStats(playerId: Principal): Promise<{
        totalResourcesEarned: bigint;
        totalTurretKills: bigint;
        turrets: Array<[string, TurretData]>;
        totalGames: bigint;
    } | null>;
    getDailyRewardStats(day: bigint): Promise<{
        totalRewardsSent: bigint;
        userRewardsSent: Array<[Principal, bigint]>;
        usersClaimed: Array<Principal>;
        timestamp: bigint;
    } | null>;
    getGif(id: string): Promise<GifMetadata | null>;
    getICPBalance(): Promise<bigint>;
    getLeaderboard(gameMode: GameMode): Promise<Array<ScoreEntry>>;
    getPersonalStats(principal: Principal): Promise<{
        flightAdventure?: bigint;
        puffinSlide?: bigint;
        puffinTowerDefense?: bigint;
        fishFrenzy?: bigint;
        puffinColonyWars?: bigint;
        puffinRescue?: bigint;
        arcticSurf?: bigint;
        puffinCatch?: bigint;
    } | null>;
    getPlayerRewardStatus(player: Principal): Promise<{
        claimedHistory: Array<RewardHistory>;
        unclaimedWins: bigint;
        totalWins: bigint;
        unclaimedAmount: bigint;
    } | null>;
    getPresetAvatar(index: bigint): Promise<Uint8Array | null>;
    getPuffinBalance(): Promise<bigint>;
    getRecentRecipients(): Promise<Array<string>>;
    getRewardHistory(): Promise<Array<RewardHistory>>;
    getTurretData(playerId: Principal, turretId: string): Promise<TurretData | null>;
    getUnclaimedRewards(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<PuffinProfile | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    placeholderChatResponse(_prompt: string): Promise<string>;
    recordGameEnd(): Promise<void>;
    recordTurretExperience(turretId: string, experience: bigint): Promise<void>;
    recordTurretKill(turretId: string, resourcesEarned: bigint): Promise<void>;
    saveCallerUserProfile(profile: PuffinProfile): Promise<void>;
    sendICPTryAccountId(to: string, amount: bigint): Promise<bigint>;
    sendPuffin(to: Principal, amount: bigint): Promise<bigint>;
    submitScore(gameMode: GameMode, playerName: string, score: bigint): Promise<void>;
    upgradeTurret(turretId: string): Promise<void>;
    uploadCustomAvatar(blob: ExternalBlob, fileType: string): Promise<AvatarType>;
    uploadGif(id: string, name: string, description: string, blob: ExternalBlob): Promise<void>;
}
