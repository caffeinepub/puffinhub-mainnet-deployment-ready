import { GameMode } from "@/backend";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetLeaderboard } from "@/hooks/useQueries";
import { useNavigate } from "@tanstack/react-router";
import { Award, Medal, Trophy } from "lucide-react";

export default function Leaderboard() {
  const navigate = useNavigate();
  const flightAdventureQuery = useGetLeaderboard(GameMode.flightAdventure);
  const fishFrenzyQuery = useGetLeaderboard(GameMode.fishFrenzy);
  const puffinRescueQuery = useGetLeaderboard(GameMode.puffinRescue);
  const arcticSurfQuery = useGetLeaderboard(GameMode.arcticSurf);
  const puffinCatchQuery = useGetLeaderboard(GameMode.puffinCatch);
  const puffinTowerDefenseQuery = useGetLeaderboard(
    GameMode.puffinTowerDefense,
  );
  const puffinColonyWarsQuery = useGetLeaderboard(GameMode.puffinColonyWars);

  const renderLeaderboardTable = (
    data:
      | Array<{ playerName: string; score: bigint; principal?: any }>
      | undefined,
    isLoading: boolean,
  ) => {
    if (isLoading) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Loading leaderboard...
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No scores yet. Be the first to play!
        </div>
      );
    }

    // Sort by score descending and take top 10
    const sortedData = [...data]
      .sort((a, b) => Number(b.score - a.score))
      .slice(0, 10);

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((entry, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {index === 0 && (
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  )}
                  {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                  {index === 2 && <Award className="h-5 w-5 text-orange-600" />}
                  {index + 1}
                </div>
              </TableCell>
              <TableCell>
                {entry.principal ? (
                  <button
                    onClick={() =>
                      navigate({ to: `/profile/${entry.principal.toString()}` })
                    }
                    className="text-primary hover:underline hover:text-primary/80 transition-colors font-medium"
                  >
                    {entry.playerName}
                  </button>
                ) : (
                  <span>{entry.playerName}</span>
                )}
              </TableCell>
              <TableCell className="text-right font-bold">
                {Number(entry.score)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-accent" />
          Game Leaderboards
        </CardTitle>
        <CardDescription>
          Top 10 players for each game mode - click names to view profiles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="flightAdventure">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="flightAdventure">Flight</TabsTrigger>
            <TabsTrigger value="fishFrenzy">Fish</TabsTrigger>
            <TabsTrigger value="puffinRescue">Rescue</TabsTrigger>
            <TabsTrigger value="arcticSurf">Surf</TabsTrigger>
            <TabsTrigger value="puffinCatch">Catch</TabsTrigger>
            <TabsTrigger value="puffinTowerDefense">Tower</TabsTrigger>
            <TabsTrigger value="puffinColonyWars">Wars</TabsTrigger>
          </TabsList>
          <TabsContent value="flightAdventure" className="mt-4">
            {renderLeaderboardTable(
              flightAdventureQuery.data,
              flightAdventureQuery.isLoading,
            )}
          </TabsContent>
          <TabsContent value="fishFrenzy" className="mt-4">
            {renderLeaderboardTable(
              fishFrenzyQuery.data,
              fishFrenzyQuery.isLoading,
            )}
          </TabsContent>
          <TabsContent value="puffinRescue" className="mt-4">
            {renderLeaderboardTable(
              puffinRescueQuery.data,
              puffinRescueQuery.isLoading,
            )}
          </TabsContent>
          <TabsContent value="arcticSurf" className="mt-4">
            {renderLeaderboardTable(
              arcticSurfQuery.data,
              arcticSurfQuery.isLoading,
            )}
          </TabsContent>
          <TabsContent value="puffinCatch" className="mt-4">
            {renderLeaderboardTable(
              puffinCatchQuery.data,
              puffinCatchQuery.isLoading,
            )}
          </TabsContent>
          <TabsContent value="puffinTowerDefense" className="mt-4">
            {renderLeaderboardTable(
              puffinTowerDefenseQuery.data,
              puffinTowerDefenseQuery.isLoading,
            )}
          </TabsContent>
          <TabsContent value="puffinColonyWars" className="mt-4">
            {renderLeaderboardTable(
              puffinColonyWarsQuery.data,
              puffinColonyWarsQuery.isLoading,
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
