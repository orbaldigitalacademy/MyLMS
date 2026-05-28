import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, CheckCircle } from "lucide-react";
import axios from "axios";

const StudentLiveClasses = () => {
  const [classes, setClasses] = useState([]);
  const [coursesMap, setCoursesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live classes and courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, coursesRes] = await Promise.all([
          axios.get("/api/live-classes"),
          axios.get("/api/courses") // fetch courses collection
        ]);

        // map course_id → course title
        const map = {};
        coursesRes.data.forEach((c) => (map[c.id] = c.title));
        setCoursesMap(map);

        // sort live classes by start time
        let sortedClasses = classesRes.data.sort(
          (a, b) => new Date(a.start_time) - new Date(b.start_time)
        );

        setClasses(sortedClasses);
      } catch (err) {
        console.error("Failed to fetch classes or courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isLiveNow = (start_time, end_time) => {
    const start = new Date(start_time);
    const end = new Date(end_time);
    return now >= start && now <= end;
  };

  const isPast = (end_time) => {
    return now > new Date(end_time);
  };

  const getCountdown = (start_time) => {
    const start = new Date(start_time);
    const diff = start - now;
    if (diff <= 0) return "Starting soon";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2,"0")}:${minutes
      .toString()
      .padStart(2,"0")}:${seconds.toString().padStart(2,"0")}`;
  };

  if (loading) return <div className="p-6">Loading live classes...</div>;
  if (!classes.length)
    return <div className="p-6 text-center text-muted-foreground">No live classes scheduled.</div>;

  // Sort: LIVE NOW first, upcoming next, past last
  const sortedDisplay = [...classes].sort((a, b) => {
    const aLive = isLiveNow(a.start_time, a.end_time);
    const bLive = isLiveNow(b.start_time, b.end_time);
    const aPast = isPast(a.end_time);
    const bPast = isPast(b.end_time);

    if (aLive && !bLive) return -1;
    if (!aLive && bLive) return 1;
    if (aPast && !bPast) return 1;
    if (!aPast && bPast) return -1;

    return new Date(a.start_time) - new Date(b.start_time);
  });

  return (
    <div className="p-6 grid gap-4">
      <h1 className="text-2xl font-serif font-bold mb-4">Live Classes</h1>

      {sortedDisplay.map((c) => {
        const liveNow = isLiveNow(c.start_time, c.end_time);
        const past = isPast(c.end_time);
        const opacityClass = past ? "opacity-50" : "opacity-100";

        return (
          <Link
            key={c.id}
            to={`/live-class/${c.id}`}
            className={`flex justify-between items-center p-4 border rounded hover:bg-gray-50 ${opacityClass}`}
          >
            <div>
              <h3 className="font-bold text-lg">{c.title}</h3>
              <p className="text-sm text-muted-foreground">
                Course: {coursesMap[c.course_id] || c.course_id}
              </p>
              <p className="text-sm text-muted-foreground">
                Date: {new Date(c.start_time).toLocaleDateString()} |{" "}
                {new Date(c.start_time).toLocaleTimeString()} -{" "}
                {new Date(c.end_time).toLocaleTimeString()}
              </p>
            </div>
            <div>
              {liveNow ? (
                <span className="flex items-center gap-1 text-green-600 font-semibold">
                  <CheckCircle className="w-5 h-5" /> LIVE NOW
                </span>
              ) : past ? (
                <span className="text-gray-400 font-medium">Ended</span>
              ) : (
                <span className="flex items-center gap-1 text-yellow-600 font-medium">
                  <Clock className="w-5 h-5" /> Starts in {getCountdown(c.start_time)}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default StudentLiveClasses;