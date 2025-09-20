import { MadeWithDyad } from "@/components/made-with-dyad";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold mb-4 text-gray-900 dark:text-white">Welcome to DAS</h1>
        <p className="text-xl text-gray-700 dark:text-gray-300">
          Your comprehensive system for managing programs, attendees, and attendance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Friends</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Manage your network of friends and participants.</p>
            <Link to="/friends">
              <Button className="w-full">Go to Friends</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Track attendance for all your sessions and programs.</p>
            <Link to="/attendance">
              <Button className="w-full">Go to Attendance</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Organize and oversee all your programs and events.</p>
            <Link to="/programs">
              <Button className="w-full">Go to Programs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;