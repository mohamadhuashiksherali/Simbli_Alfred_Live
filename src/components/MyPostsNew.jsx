import Ai from "../assets/AiImage2.png";
import tick from "../assets/svgs/tick.svg";
import linkdin from "../assets/svgs/linkdin.svg";
import upArrow from "../assets/svgs/upArrow.svg";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Calendar,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Zap,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
const MyPostsNew = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDatePosts, setSelectedDatePosts] = useState([]);
  const posts = [
    {
      id: 1,
      status: "Published",
      platform: "LinkedIn",
      time: "11:30 AM",
      text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      image: Ai,
      tags: ["#Ai", "#Technology", "#Innovation"],
      more: "+2 more",
    },
    {
      id: 2,
      status: "Published",
      platform: "LinkedIn",
      time: "11:30 AM",
      text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      image: Ai,
      tags: ["#Ai", "#Technology", "#Innovation"],
      more: "+2 more",
    },
  ];
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startWeekday = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
    const endWeekday = lastDay.getDay();

    const days = [];

    // Leading placeholders to align first day under correct weekday
    for (let i = 0; i < startWeekday; i++) {
      days.push({ isPlaceholder: true });
    }

    // Actual days of current month
    const cursor = new Date(firstDay);
    while (cursor <= lastDay) {
      const dayPosts = getPostsForDate(cursor);
      const isToday = cursor.toDateString() === new Date().toDateString();
      const isSelected =
        selectedDate && cursor.toDateString() === selectedDate.toDateString();

      days.push({
        date: new Date(cursor),
        posts: dayPosts,
        isCurrentMonth: true,
        isToday,
        isSelected,
        isPlaceholder: false,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Trailing placeholders to complete the last week (but do not force 6 rows)
    const trailing = 6 - endWeekday;
    for (let i = 0; i < trailing; i++) {
      days.push({ isPlaceholder: true });
    }

    return days;
  };
  const getPostsForDate = (date) => {
    return posts.filter((post) => {
      const postDate = new Date(post.date);
      return postDate.toDateString() === date.toDateString();
    });
  };
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const displayPosts = selectedDate ? selectedDatePosts : posts;
  return (
    <div className="flex flex-wrap   p-10 ">
    
        {/* Calendar - compact on the left */}
        <div className="flex-1 max-w-md">
          <div
            className="backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden border"
            style={{ background: "#1D2027", borderColor: "#1D2027" }}
          >
            {/* Calendar Header */}
            <div
              className="px-3 md:px-4 py-2.5 md:py-3 text-black"
              style={{
                background: "linear-gradient(180deg, #7EDD7E 0%, #57C957 100%)",
              }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold">
                  {monthNames[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-1.5 hover:bg-black/10 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-2.5 py-1 text-sm bg-black/10 hover:bg-black/20 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-1.5 hover:bg-black/10 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="px-3 md:px-4 py-2.5 md:py-3">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-3">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs md:text-sm font-semibold text-gray-400 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((day, index) =>
                  day.isPlaceholder ? (
                    <div
                      key={index}
                      className="p-1.5 h-12 md:h-16 rounded-lg border border-transparent"
                    />
                  ) : (
                    <button
                      key={index}
                      onClick={() => handleDateClick(day.date)}
                      className={`relative p-1.5 h-12 md:h-16 rounded-lg transition-all duration-200 text-left border ${
                        day.isSelected
                          ? "border-[#79DB79] bg-[#121318]"
                          : day.isToday
                          ? "bg-[#121318] border-[#175817]"
                          : "hover:bg-[#121318] border-[#1D2027]"
                      }`}
                    >
                      <div
                        className={`text-[10px] md:text-xs font-medium text-gray-100`}
                      >
                        {day.date.getDate()}
                      </div>

                      {/* Post Indicators */}
                      {day.posts.length > 0 && (
                        <div className="absolute bottom-1 left-1 right-1">
                          <div className="flex flex-wrap gap-0.5">
                            {day.posts.slice(0, 3).map((post, postIndex) => (
                              <div
                                key={postIndex}
                                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
                                  post.type === "published" || post.status === "published"
                                    ? "bg-[#79DB79]"
                                    : post.status === "pending"
                                    ? "bg-blue-500"
                                    : "bg-gray-400"
                                }`}
                                title={`${
                                  post.type === "published" || post.status === "published"
                                    ? "Published"
                                    : "Scheduled"
                                }: ${post.content_text?.substring(0, 50)}...`}
                              />
                            ))}
                            {day.posts.length > 3 && (
                              <div
                                className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gray-300"
                                title={`+${day.posts.length - 3} more`}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
     
      <div className="flex-1 rounded-lg bg-white shadow-md max-w-fit p-6">
        <h4 className="text-[#000000] text-[20px] content-history font-inter">
          All Post
        </h4>
        <div className="grid grid-cols-1 max-w-3xl md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="border border-gray-200 rounded-xl shadow-sm p-4 bg-[#FAFAFA]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[#2FC051] font-inter text-md font-medium flex items-center gap-2">
                    <img src={tick} loading="lazy" />
                    {post.status}
                  </span>

                  <img src={linkdin} alt="linkdin" loading="lazy" />
                </div>
                <span className="text-[#6E6E6E] font-normal text-sm">
                  {post.time}
                </span>
              </div>

              <p className="text-[#1A1A1A] font-normal font-inter text-sm mt-2">
                {post.text}
              </p>

              <img
                src={post.image}
                alt="post"
                loading="lazy"
                className="w-full h-40 object-cover rounded-md mt-3"
              />

              <div className="flex flex-wrap gap-2 mt-3">
                {post.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="bg-[#EBF3FF]  text-sm border border-[#75BBF4] text-[#1A75BF]  px-2 py-1 rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
                <span className="text-gray-500 text-xs flex items-center">
                  {post.more}
                </span>
              </div>

              <div className="mt-3">
                <Link
                  to="#"
                  className=" flex items-center gap-2 font-medium text-sm !no-underline"
                >
                  <img src={upArrow} alt="arrow" loading="lazy" />
                  <span className="text-[#57C957]  ">View Post</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyPostsNew;
