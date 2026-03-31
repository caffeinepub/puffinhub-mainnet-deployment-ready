import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Nat64 "mo:core/Nat64";
import Int "mo:core/Int";
import List "mo:core/List";
import Set "mo:core/Set";
import Blob "mo:core/Blob";
import Nat8 "mo:core/Nat8";
import Char "mo:core/Char";

actor {
  let storage = Storage.new();
  include MixinStorage(storage);

  let accessControlState = AccessControl.initState();

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  type GifMetadata = {
    id : Text;
    name : Text;
    description : Text;
    blob : Storage.ExternalBlob;
    owner : Principal;
  };

  var gifs = Map.empty<Text, GifMetadata>();

  public shared ({ caller }) func uploadGif(id : Text, name : Text, description : Text, blob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload gifs");
    };

    if (gifs.size() >= 100) {
      Runtime.trap("Cannot upload more than 100 GIFs");
    };

    let metadata : GifMetadata = {
      id;
      name;
      description;
      blob;
      owner = caller;
    };
    gifs.add(id, metadata);
  };

  public query func getGif(id : Text) : async ?GifMetadata {
    gifs.get(id);
  };

  public query func getAllGifs() : async [GifMetadata] {
    gifs.values().toArray();
  };

  public shared ({ caller }) func deleteCallerGif(id : Text) : async { deleted : Bool } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete gifs");
    };

    switch (gifs.get(id)) {
      case (?gif) {
        if (gif.owner != caller and not (AccessControl.isAdmin(accessControlState, caller))) {
          Runtime.trap("Unauthorized: Can only delete your own gifs");
        };
        gifs.remove(id);
        { deleted = true };
      };
      case (null) { { deleted = false } };
    };
  };

  type ScoreEntry = {
    playerName : Text;
    score : Nat;
    principal : ?Principal;
  };

  type GameMode = {
    #flightAdventure;
    #fishFrenzy;
    #puffinRescue;
    #arcticSurf;
    #puffinSlide;
    #puffinCatch;
    #puffinTowerDefense;
    #puffinColonyWars;
  };

  var flightAdventureScores = Map.empty<Nat, ScoreEntry>();
  var fishFrenzyScores = Map.empty<Nat, ScoreEntry>();
  var puffinRescueScores = Map.empty<Nat, ScoreEntry>();
  var arcticSurfScores = Map.empty<Nat, ScoreEntry>();
  var puffinSlideScores = Map.empty<Nat, ScoreEntry>();
  var puffinCatchScores = Map.empty<Nat, ScoreEntry>();
  var puffinTowerDefenseScores = Map.empty<Nat, ScoreEntry>();
  var puffinColonyWarsScores = Map.empty<Nat, ScoreEntry>();
  var nextScoreId = 0;

  public shared ({ caller }) func submitScore(gameMode : GameMode, playerName : Text, score : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit scores");
    };

    let entry : ScoreEntry = {
      playerName;
      score;
      principal = ?caller;
    };

    switch (gameMode) {
      case (#flightAdventure) { flightAdventureScores.add(nextScoreId, entry) };
      case (#fishFrenzy) { fishFrenzyScores.add(nextScoreId, entry) };
      case (#puffinRescue) { puffinRescueScores.add(nextScoreId, entry) };
      case (#arcticSurf) { arcticSurfScores.add(nextScoreId, entry) };
      case (#puffinSlide) { puffinSlideScores.add(nextScoreId, entry) };
      case (#puffinCatch) { puffinCatchScores.add(nextScoreId, entry) };
      case (#puffinTowerDefense) { puffinTowerDefenseScores.add(nextScoreId, entry) };
      case (#puffinColonyWars) {
        puffinColonyWarsScores.add(nextScoreId, entry);
        trackColonyWarsWin(caller, score);
      };
    };
    nextScoreId += 1;
  };

  public query func getLeaderboard(gameMode : GameMode) : async [ScoreEntry] {
    switch (gameMode) {
      case (#flightAdventure) { flightAdventureScores.values().toArray() };
      case (#fishFrenzy) { fishFrenzyScores.values().toArray() };
      case (#puffinRescue) { puffinRescueScores.values().toArray() };
      case (#arcticSurf) { arcticSurfScores.values().toArray() };
      case (#puffinSlide) { puffinSlideScores.values().toArray() };
      case (#puffinCatch) { puffinCatchScores.values().toArray() };
      case (#puffinTowerDefense) { puffinTowerDefenseScores.values().toArray() };
      case (#puffinColonyWars) { puffinColonyWarsScores.values().toArray() };
    };
  };

  type TurretData = {
    id : Text;
    level : Nat;
    experience : Nat;
    kills : Nat;
  };

  type ColonyWarsStats = {
    totalGames : Nat;
    totalTurretKills : Nat;
    totalResourcesEarned : Nat;
    turrets : Map.Map<Text, TurretData>;
  };

  var colonyWarsStats = Map.empty<Principal, ColonyWarsStats>();
  public shared ({ caller }) func recordTurretKill(turretId : Text, resourcesEarned : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record turret kills");
    };

    let currentStats = switch (colonyWarsStats.get(caller)) {
      case (?stats) { stats };
      case (null) {
        {
          totalGames = 0;
          totalTurretKills = 0;
          totalResourcesEarned = 0;
          turrets = Map.empty<Text, TurretData>();
        };
      };
    };

    var updatedTurretData : TurretData = switch (currentStats.turrets.get(turretId)) {
      case (?data) { { data with kills = data.kills + 1 } };
      case (null) { { id = turretId; level = 1; experience = 0; kills = 1 } };
    };

    let updatedTurrets = currentStats.turrets.clone();
    updatedTurrets.add(turretId, updatedTurretData);

    let newStats = {
      currentStats with
      totalTurretKills = currentStats.totalTurretKills + 1;
      totalResourcesEarned = currentStats.totalResourcesEarned + resourcesEarned;
      turrets = updatedTurrets;
    };

    colonyWarsStats.add(caller, newStats);
  };

  public shared ({ caller }) func upgradeTurret(turretId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upgrade turrets");
    };

    switch (colonyWarsStats.get(caller)) {
      case (?stats) {
        switch (stats.turrets.get(turretId)) {
          case (?turret) {
            let upgradedTurret = { turret with level = turret.level + 1; experience = 0 };

            let updatedTurrets = stats.turrets.clone();
            updatedTurrets.add(turretId, upgradedTurret);

            let newStats = { stats with turrets = updatedTurrets };

            colonyWarsStats.add(caller, newStats);
          };
          case (null) {};
        };
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func recordTurretExperience(turretId : Text, experience : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record turret experience");
    };

    switch (colonyWarsStats.get(caller)) {
      case (?stats) {
        switch (stats.turrets.get(turretId)) {
          case (?turret) {
            let updatedTurret = { turret with experience = turret.experience + experience };

            let updatedTurrets = stats.turrets.clone();
            updatedTurrets.add(turretId, updatedTurret);

            let newStats = { stats with turrets = updatedTurrets };

            colonyWarsStats.add(caller, newStats);
          };
          case (null) {};
        };
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func recordGameEnd() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record game end");
    };

    let currentStats = switch (colonyWarsStats.get(caller)) {
      case (?stats) { stats };
      case (null) { { totalGames = 0; totalTurretKills = 0; totalResourcesEarned = 0; turrets = Map.empty<Text, TurretData>() } };
    };

    let newStats = { currentStats with totalGames = currentStats.totalGames + 1 };

    colonyWarsStats.add(caller, newStats);
  };

  public query func getColonyWarsStats(
    playerId : Principal,
  ) : async ?{
    totalGames : Nat;
    totalTurretKills : Nat;
    totalResourcesEarned : Nat;
    turrets : [(Text, TurretData)];
  } {
    switch (colonyWarsStats.get(playerId)) {
      case (?stats) {
        ?{ stats with turrets = stats.turrets.toArray() };
      };
      case (null) { null };
    };
  };

  public query func getAllColonyWarsStats() : async [(Principal, {
    totalGames : Nat;
    totalTurretKills : Nat;
    totalResourcesEarned : Nat;
    turrets : [(Text, TurretData)];
  })] {
    let entries = colonyWarsStats.toArray();

    entries.map<(Principal, ColonyWarsStats), (Principal, {
      totalGames : Nat;
      totalTurretKills : Nat;
      totalResourcesEarned : Nat;
      turrets : [(Text, TurretData)];
    })>(func((playerId, stats)) { (playerId, { stats with turrets = stats.turrets.toArray() }) });
  };

  public query func getTurretData(playerId : Principal, turretId : Text) : async ?TurretData {
    switch (colonyWarsStats.get(playerId)) {
      case (?stats) { stats.turrets.get(turretId) };
      case (null) { null };
    };
  };

  // ===== REWARDS SYSTEM =====

  // Daily Rewards Tracking Types
  type DailyRewards = {
    timestamp : Int;
    totalRewardsSent : Nat;
    userRewardsSent : Map.Map<Principal, Nat>;
    usersClaimed : Set.Set<Principal>;
  };

  // Core Reward Records
  type RewardWin = {
    score : Nat;
    timestamp : Int;
    claimed : Bool;
  };

  type RewardHistory = {
    amount : Nat;
    timestamp : Int;
    blockIndex : Nat;
  };

  type PlayerRewards = {
    wins : List.List<RewardWin>;
    claimedHistory : List.List<RewardHistory>;
  };

  // Persistent Storage Maps
  var playerRewards = Map.empty<Principal, PlayerRewards>();
  var dailyRewards = Map.empty<Int, DailyRewards>();

  // Reward Parameters
  let REWARD_PER_WIN : Nat = 100_000; // 0.001 ICP in e8s
  let MAX_DAILY_REWARDS = 50;
  let MAX_DAILY_USER_REWARDS = 5;
  let TREASURY_PRINCIPAL : Principal = Principal.fromText("4ru6k-ahn5v-lt2ql-wc7bb-4d2cw-3fevh-4x4ss-h3646-kgvwu-rz6xx-hqe");

  // Get current day in seconds since epoch
  func getCurrentDay() : Int {
    Time.now() / 1_000_000_000 / 86400;
  };

  // Track Colony Wars wins for reward eligibility (called internally by submitScore)
  func trackColonyWarsWin(player : Principal, score : Nat) {
    let currentRewards = switch (playerRewards.get(player)) {
      case (?rewards) { rewards };
      case (null) {
        {
          wins = List.empty<RewardWin>();
          claimedHistory = List.empty<RewardHistory>();
        };
      };
    };

    let newWin : RewardWin = {
      score;
      timestamp = Time.now();
      claimed = false;
    };

    let updatedWinsArray = currentRewards.wins.toArray().concat([newWin]);
    let updatedWins = List.fromArray<RewardWin>(updatedWinsArray);

    let updatedRewards = {
      currentRewards with
      wins = updatedWins;
    };

    playerRewards.add(player, updatedRewards);
  };

  // Get unclaimed reward balance for the caller
  public query ({ caller }) func getUnclaimedRewards() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their rewards");
    };

    switch (playerRewards.get(caller)) {
      case (?rewards) {
        let unclaimedWins = rewards.wins.filter(func(win) { not win.claimed });
        let count = unclaimedWins.size();
        count * REWARD_PER_WIN;
      };
      case (null) { 0 };
    };
  };

  // Get reward history for the caller
  public query ({ caller }) func getRewardHistory() : async [RewardHistory] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their reward history");
    };

    switch (playerRewards.get(caller)) {
      case (?rewards) { rewards.claimedHistory.toArray() };
      case (null) { [] };
    };
  };

  // Claim accumulated rewards
  public shared ({ caller }) func claimRewards() : async { blockIndex : Nat; amount : Nat } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can claim rewards");
    };

    // Check daily limits
    let currentDay = getCurrentDay();

    let day = switch (dailyRewards.get(currentDay)) {
      case (?d) { d };
      case (null) {
        let newDay = {
          timestamp = Time.now();
          totalRewardsSent = 0;
          userRewardsSent = Map.empty<Principal, Nat>();
          usersClaimed = Set.empty<Principal>();
        };
        dailyRewards.add(currentDay, newDay);
        newDay;
      };
    };

    // Check if caller has already claimed rewards today
    if (day.usersClaimed.contains(caller)) {
      Runtime.trap("Daily reward limit reached: Can only claim rewards once per day");
    };

    // Count unclaimed wins
    let currentRewards = switch (playerRewards.get(caller)) {
      case (?rewards) { rewards };
      case (null) { Runtime.trap("No rewards available to claim") };
    };

    let unclaimedWins = currentRewards.wins.filter(func(win) { not win.claimed });
    let unclaimedCount = unclaimedWins.size();

    if (unclaimedCount == 0) {
      Runtime.trap("No unclaimed rewards available");
    };

    // Calculate total reward amount and ensure it doesn't exceed daily limits
    let userDailyCount = switch (day.userRewardsSent.get(caller)) {
      case (?count) { count };
      case (null) { 0 };
    };

    if (userDailyCount + unclaimedCount > MAX_DAILY_USER_REWARDS) {
      Runtime.trap("Daily reward limit reached: Maximum of 5 rewards per day");
    };

    if (day.totalRewardsSent + unclaimedCount > MAX_DAILY_REWARDS) {
      Runtime.trap("Daily reward limit reached: Maximum of 50 rewards per day");
    };

    let totalReward = unclaimedCount * REWARD_PER_WIN;

    // Transfer ICP from treasury to caller
    let ledger = actor (ICP_LEDGER_CANISTER.toText()) : actor {
      icrc1_transfer : (TransferArg) -> async TransferResult;
    };

    let transferArg : TransferArg = {
      from_subaccount = null;
      to = {
        owner = caller;
        subaccount = null;
      };
      amount = totalReward;
      fee = ?TRANSFER_FEE;
      memo = null;
      created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
    };

    let result = await ledger.icrc1_transfer(transferArg);

    let blockIndex = switch (result) {
      case (#Ok(index)) { index };
      case (#Err(error)) { handleTransferError(error) };
    };

    // Mark all wins as claimed
    let claimedWins = List.empty<RewardWin>();
    for (win in currentRewards.wins.values()) {
      claimedWins.add(
        if (not win.claimed) {
          { win with claimed = true };
        } else {
          win;
        }
      );
    };

    // Add to claimed history
    let historyEntry : RewardHistory = {
      amount = totalReward;
      timestamp = Time.now();
      blockIndex;
    };

    let updatedHistoryArray = currentRewards.claimedHistory.toArray().concat([historyEntry]);
    let updatedHistory = List.fromArray<RewardHistory>(updatedHistoryArray);

    let updatedRewards = {
      wins = claimedWins;
      claimedHistory = updatedHistory;
    };

    playerRewards.add(caller, updatedRewards);

    // Update daily rewards tracking
    let newUserCount = userDailyCount + unclaimedCount;
    let newDay = {
      day with
      totalRewardsSent = day.totalRewardsSent + unclaimedCount;
      userRewardsSent = day.userRewardsSent.clone();
      usersClaimed = day.usersClaimed.clone();
    };
    newDay.userRewardsSent.add(caller, newUserCount);
    newDay.usersClaimed.add(caller);

    dailyRewards.add(currentDay, newDay);

    { blockIndex; amount = totalReward };
  };

  // Admin function to view any player's reward status
  public query ({ caller }) func getPlayerRewardStatus(player : Principal) : async ?{
    unclaimedWins : Nat;
    totalWins : Nat;
    unclaimedAmount : Nat;
    claimedHistory : [RewardHistory];
  } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view other players' reward status");
    };

    switch (playerRewards.get(player)) {
      case (?rewards) {
        let unclaimedWins = rewards.wins.filter(func(win) { not win.claimed });
        let unclaimedCount = unclaimedWins.size();
        let totalWins = rewards.wins.size();

        ?{
          unclaimedWins = unclaimedCount;
          totalWins;
          unclaimedAmount = unclaimedCount * REWARD_PER_WIN;
          claimedHistory = rewards.claimedHistory.toArray();
        };
      };
      case (null) { null };
    };
  };

  // Admin function to get all daily reward statistics
  public query ({ caller }) func getDailyRewardStats(day : Int) : async ?{
    timestamp : Int;
    totalRewardsSent : Nat;
    userRewardsSent : [(Principal, Nat)];
    usersClaimed : [Principal];
  } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view daily reward stats");
    };

    switch (dailyRewards.get(day)) {
      case (?d) {
        ?{
          timestamp = d.timestamp;
          totalRewardsSent = d.totalRewardsSent;
          userRewardsSent = d.userRewardsSent.toArray();
          usersClaimed = d.usersClaimed.toArray();
        };
      };
      case (null) { null };
    };
  };

  // ===== END REWARDS SYSTEM =====

  var puffinSVGs = [
    Blob.fromArray([
      60, 115, 118, 103, 32, 120, 109, 108, 110, 115, 61, 34, 104, 116, 116, 112, 58, 47, 47, 119, 119, 119, 46, 119, 51, 46, 111, 114, 103, 47, 50, 48, 48, 48, 47, 115, 118, 103, 34, 32, 119, 105, 100, 116, 104, 61, 34, 49, 48, 48, 34, 32, 104, 101, 105, 103, 104, 116, 61, 34, 49, 48, 48, 34, 62, 60, 114, 101, 99, 116, 32, 119, 105, 100, 116, 104, 61, 34, 49, 48, 48, 37, 34, 32, 104, 101, 105, 103, 104, 116, 61, 34, 49, 48, 48, 37, 34, 32, 102, 105, 108, 108, 61, 34, 35, 70, 70, 70, 70, 70, 70, 34, 32, 47, 62, 10, 60, 99, 105, 114, 99, 108, 101, 32, 99, 120, 61, 34, 53, 53, 34, 32, 99, 121, 61, 34, 53, 53, 34, 32, 114, 61, 34, 51, 48, 34, 32, 102, 105, 108, 108, 61, 34, 35, 70, 70, 54, 70, 69, 70, 34, 32, 115, 116, 114, 111, 107, 101, 61, 34, 35, 69, 57, 68, 69, 68, 53, 34, 32, 115, 116, 114, 111, 107, 101, 45, 119, 105, 100, 116, 104, 61, 34, 52, 34, 32, 47, 62, 10, 60, 99, 105, 114, 99, 108, 101, 32, 99, 120, 61, 34, 55, 48, 34, 32, 99, 121, 61, 34, 54, 53, 34, 32, 114, 61, 34, 49, 53, 34, 32, 102, 105, 108, 108, 61, 34, 35, 70, 70, 69, 66, 56, 50, 34, 32, 115, 116, 114, 111, 107, 101, 61, 34, 35, 68, 56, 65, 50, 65, 54, 34, 32, 115, 116, 114, 111, 107, 101, 45, 119, 105, 100, 116, 104, 61, 34, 51, 34, 32, 47, 62, 10, 60, 99, 105, 114, 99, 108, 101, 32, 99, 120, 61, 34, 57, 55, 34, 32, 99, 121, 61, 34, 54, 53, 34, 32, 114, 61, 34, 51, 34, 32, 102, 105, 108, 108, 61, 34, 35, 52, 68, 52, 68, 52, 68, 34, 32, 115, 116, 114, 111, 107, 101, 61, 34, 35, 50, 68, 50, 68, 50, 68, 34, 32, 115, 116, 114, 111, 107, 101, 45, 119, 105, 100, 116, 104, 61, 34, 50, 34, 32, 47, 62, 10, 60, 47, 115, 118, 103, 62,
    ]),
    Blob.fromArray([
      60, 115, 118, 103, 32, 120, 109, 108, 110, 115, 61, 34, 104, 116, 116, 112, 58, 47, 47, 119, 119, 119, 46, 119, 51, 46, 111, 114, 103, 47, 50, 48, 48, 48, 47, 115, 118, 103, 34, 32, 119, 105, 100, 116, 104, 61, 34, 49, 48, 48, 34, 32, 104, 101, 105, 103, 104, 116, 61, 34, 49, 48, 48, 34, 62, 60, 114, 101, 99, 116, 32, 119, 105, 100, 116, 104, 61, 34, 49, 48, 48, 37, 34, 32, 104, 101, 105, 103, 104, 116, 61, 34, 49, 48, 48, 37, 34, 32, 102, 105, 108, 108, 61, 34, 35, 70, 70, 70, 70, 70, 70, 34, 32, 47, 62, 10, 60, 99, 105, 114, 99, 108, 101, 32, 99, 120, 61, 34, 53, 48, 34, 32, 99, 121, 61, 34, 53, 48, 34, 32, 114, 61, 34, 52, 48, 34, 32, 102, 105, 108, 108, 61, 34, 35, 70, 70, 70, 57, 68, 57, 34, 32, 115, 116, 114, 111, 107, 101, 61, 34, 35, 57, 57, 67, 48, 69, 54, 34, 32, 115, 116, 114, 111, 107, 101, 45, 119, 105, 100, 116, 104, 61, 34, 54, 34, 32, 47, 62, 10, 60, 101, 108, 108, 105, 112, 115, 101, 32, 99, 120, 61, 34, 55, 48, 34, 32, 99, 121, 61, 34, 51, 48, 34, 32, 114, 120, 61, 34, 49, 48, 34, 32, 114, 121, 61, 34, 53, 34, 32, 102, 105, 108, 108, 61, 34, 35, 70, 70, 56, 56, 53, 54, 34, 32, 47, 62, 10, 60, 99, 105, 114, 99, 108, 101, 32, 99, 120, 61, 34, 57, 53, 34, 32, 99, 121, 61, 34, 50, 48, 34, 32, 114, 61, 34, 53, 34, 32, 102, 105, 108, 108, 61, 34, 35, 51, 55, 51, 55, 51, 55, 34, 32, 47, 62, 10, 60, 47, 115, 118, 103, 62,
    ]),
  ];

  // Public access - no authentication required for viewing preset avatars
  public query func getPresetAvatar(index : Nat) : async ?Blob {
    if (index < puffinSVGs.size()) {
      ?puffinSVGs[index];
    } else {
      null;
    };
  };

  // Public access - no authentication required for viewing avatars
  public query func getAvatar(avatarType : AvatarType) : async ?Blob {
    switch (avatarType) {
      case (#preset index) {
        if (index < puffinSVGs.size()) {
          ?puffinSVGs[index];
        } else {
          null;
        };
      };
      case (#custom data) { null };
    };
  };

  public query ({ caller }) func getCallerPrincipal() : async Principal {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their principal");
    };
    caller;
  };

  type Account = {
    owner : Principal;
    subaccount : ?Blob;
  };

  type TransferArg = {
    from_subaccount : ?Blob;
    to : Account;
    amount : Nat;
    fee : ?Nat;
    memo : ?Blob;
    created_at_time : ?Nat64;
  };

  type TransferError = {
    #BadFee : { expected_fee : Nat };
    #BadBurn : { min_burn_amount : Nat };
    #InsufficientFunds : { balance : Nat };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError : { error_code : Nat; message : Text };
  };

  type TransferResult = {
    #Ok : Nat;
    #Err : TransferError;
  };

  type PuffinProfile = {
    displayName : Text;
    avatarType : AvatarType;
    bio : Text;
  };

  type AvatarType = {
    #preset : Nat;
    #custom : { blob : Storage.ExternalBlob; fileType : Text };
  };

  var userProfiles = Map.empty<Principal, PuffinProfile>();

  public shared ({ caller }) func saveCallerUserProfile(profile : PuffinProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?PuffinProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return null;
    };
    userProfiles.get(caller);
  };

  // Public access - no authentication required for viewing public profiles
  public query func getUserProfile(user : Principal) : async ?PuffinProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func uploadCustomAvatar(blob : Storage.ExternalBlob, fileType : Text) : async AvatarType {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload avatars");
    };

    #custom { blob; fileType };
  };

  let ICP_LEDGER_CANISTER : Principal = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");
  let TRANSFER_FEE : Nat = 10_000;

  var userRecentRecipients = Map.empty<Principal, List.List<Text>>();

  func addRecipientToHistory(caller : Principal, to : Text) {
    let maxSize = 5;
    let currentList = switch (userRecentRecipients.get(caller)) {
      case (?list) { list };
      case (null) { List.empty<Text>() };
    };

    var updatedList = currentList;
    if (updatedList.size() >= maxSize) {
      let array = updatedList.toArray();
      if (array.size() > 0) {
        updatedList := List.empty<Text>();
        let newArray = array.sliceToArray(0, array.size() - 1);
        for (entry in newArray.values()) {
          updatedList.add(entry);
        };
      };
    };
    updatedList.add(to);
    userRecentRecipients.add(caller, updatedList);
  };

  func isHexChar(c : Char) : Bool {
    (c >= '0' and c <= '9') or (c >= 'a' and c <= 'f') or (c >= 'A' and c <= 'F');
  };

  func isHexString(s : Text) : Bool {
    if (s.size() == 0) { return false };
    for (c in s.chars()) {
      if (not isHexChar(c)) { return false };
    };
    true;
  };

  func decodeHexChar(c : Char) : Nat8 {
    if (c >= '0' and c <= '9') {
      return Nat8.fromNat((c.toNat32() - '0'.toNat32()).toNat());
    };
    if (c >= 'a' and c <= 'f') {
      return Nat8.fromNat((c.toNat32() - 'a'.toNat32()).toNat()) + 10;
    };
    if (c >= 'A' and c <= 'F') {
      return Nat8.fromNat((c.toNat32() - 'A'.toNat32()).toNat()) + 10;
    };
    0;
  };

  func hexStringToBlob(hex : Text) : ?Blob {
    if (not isHexString(hex) or hex.size() % 2 != 0) {
      return null;
    };

    let chars = hex.toArray();
    let size = chars.size() / 2;
    let bytes = Array.tabulate(
      size,
      func(i) {
        let high = decodeHexChar(chars[i * 2]);
        let low = decodeHexChar(chars[i * 2 + 1]);
        (high * 16) + low;
      },
    );
    ?Blob.fromArray(bytes);
  };

  func isPrincipalFormat(s : Text) : Bool {
    if (s.size() < 5) { return false };

    var hasHyphen = false;
    for (c in s.chars()) {
      if (c == '-') {
        hasHyphen := true;
      } else if (not ((c >= 'a' and c <= 'z') or (c >= '0' and c <= '9'))) {
        return false;
      };
    };
    hasHyphen;
  };

  public query ({ caller }) func getRecentRecipients() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view recent recipients");
    };

    switch (userRecentRecipients.get(caller)) {
      case (?list) { list.toArray() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func sendICPTryAccountId(to : Text, amount : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send ICP");
    };

    if (amount == 0) {
      Runtime.trap("Invalid amount: Must be greater than zero");
    };

    if (to.size() == 0) {
      Runtime.trap("Recipient cannot be empty");
    };

    let ledger = actor (ICP_LEDGER_CANISTER.toText()) : actor {
      icrc1_transfer : (TransferArg) -> async TransferResult;
      icrc1_balance_of : (Account) -> async Nat;
    };

    let senderAccount : Account = {
      owner = caller;
      subaccount = null;
    };

    let balance = await ledger.icrc1_balance_of(senderAccount);

    if (amount + TRANSFER_FEE > balance) {
      let maxSendable = if (balance >= TRANSFER_FEE) { balance - TRANSFER_FEE } else { 0 };
      Runtime.trap("Insufficient funds: Balance is " # balance.toText() # " , max transferable is " # maxSendable.toText());
    };

    func performTransfer(toAccount : Account) : async Nat {
      let transferArg : TransferArg = {
        from_subaccount = null;
        to = toAccount;
        amount;
        fee = ?TRANSFER_FEE;
        memo = null;
        created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
      };
      let result = await ledger.icrc1_transfer(transferArg);
      switch (result) {
        case (#Ok(blockIndex)) {
          addRecipientToHistory(caller, to);
          blockIndex;
        };
        case (#Err(error)) { handleTransferError(error) };
      };
    };

    if (to.size() == 64 and isHexString(to)) {
      switch (hexStringToBlob(to)) {
        case (?accountIdBlob) {
          return await performTransfer({
            owner = caller;
            subaccount = ?accountIdBlob;
          });
        };
        case (null) {
          Runtime.trap("Invalid Account ID format: Could not decode hex string");
        };
      };
    } else if (isPrincipalFormat(to)) {
      let principal = try {
        Principal.fromText(to);
      } catch (e) {
        Runtime.trap("Invalid Principal ID format: " # to);
      };

      return await performTransfer({
        owner = principal;
        subaccount = null;
      });
    } else {
      Runtime.trap("Invalid recipient format: Must be either a Principal ID (with hyphens) or a 64-character hexadecimal Account ID");
    };
  };

  func handleTransferError(error : TransferError) : Nat {
    let errorMsg = switch (error) {
      case (#BadFee { expected_fee }) { "Bad fee: Expected " # expected_fee.toText() };
      case (#BadBurn { min_burn_amount }) { "Bad burn: Minimum " # min_burn_amount.toText() };
      case (#InsufficientFunds { balance }) { "Insufficient funds: Balance is " # balance.toText() };
      case (#TooOld) { "Transaction too old" };
      case (#CreatedInFuture { ledger_time }) { "Transaction created in future" };
      case (#Duplicate { duplicate_of }) { "Duplicate transaction" };
      case (#TemporarilyUnavailable) { "Ledger temporarily unavailable" };
      case (#GenericError { error_code; message }) { "Error " # error_code.toText() # ": " # message };
    };
    Runtime.trap(errorMsg);
  };

  public shared ({ caller }) func getICPBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can check their balance");
    };

    let account : Account = {
      owner = caller;
      subaccount = null;
    };

    let ledger = actor (ICP_LEDGER_CANISTER.toText()) : actor {
      icrc1_balance_of : (Account) -> async Nat;
    };

    await ledger.icrc1_balance_of(account);
  };

  public query ({ caller }) func getAccountID() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their account ID");
    };
    caller.toText();
  };

  public shared ({ caller }) func getPuffinBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check their balance");
    };
    Runtime.trap("Bonding Phase: Puffin token not yet launched");
  };

  public shared ({ caller }) func sendPuffin(to : Principal, amount : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send Puffin tokens");
    };

    if (to.isAnonymous()) {
      Runtime.trap("Invalid recipient: Cannot send to anonymous principal");
    };

    if (amount == 0) {
      Runtime.trap("Invalid amount: Must be greater than zero");
    };

    Runtime.trap("Bonding Phase: Puffin token transfers not yet available");
  };

  // Public access - no authentication required for viewing public stats
  public query func getPersonalStats(principal : Principal) : async ?{
    flightAdventure : ?Nat;
    fishFrenzy : ?Nat;
    puffinRescue : ?Nat;
    arcticSurf : ?Nat;
    puffinSlide : ?Nat;
    puffinCatch : ?Nat;
    puffinTowerDefense : ?Nat;
    puffinColonyWars : ?Nat;
  } {
    let entries : [(GameMode, Map.Map<Nat, ScoreEntry>)] = [
      (#flightAdventure, flightAdventureScores),
      (#fishFrenzy, fishFrenzyScores),
      (#puffinRescue, puffinRescueScores),
      (#arcticSurf, arcticSurfScores),
      (#puffinSlide, puffinSlideScores),
      (#puffinCatch, puffinCatchScores),
      (#puffinTowerDefense, puffinTowerDefenseScores),
      (#puffinColonyWars, puffinColonyWarsScores),
    ];

    var hasAnyScore = false;

    func getHighestScore(map : Map.Map<Nat, ScoreEntry>) : ?Nat {
      let scores = map.values().toArray();
      var maxScore : ?Nat = null;
      for (entry in scores.values()) {
        if (switch (entry.principal) { case (?p) { Principal.equal(p, principal) }; case (null) { false } }) {
          hasAnyScore := true;
          maxScore := switch (maxScore) {
            case (null) { ?entry.score };
            case (?currentMax) {
              if (entry.score > currentMax) { ?entry.score } else { ?currentMax };
            };
          };
        };
      };
      maxScore;
    };

    let scores = entries.map(func((_, map)) { getHighestScore(map) });

    if (hasAnyScore) {
      ?{
        flightAdventure = scores[0];
        fishFrenzy = scores[1];
        puffinRescue = scores[2];
        arcticSurf = scores[3];
        puffinSlide = scores[4];
        puffinCatch = scores[5];
        puffinTowerDefense = scores[6];
        puffinColonyWars = scores[7];
      };
    } else {
      null;
    };
  };

  public query ({ caller }) func placeholderChatResponse(_prompt : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can use chat");
    };

    "This feature is coming soon! I am currently under development. Stay tuned for updates!";
  };
};
