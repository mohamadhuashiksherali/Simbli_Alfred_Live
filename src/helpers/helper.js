import moment from "moment";
//Week Ranges
export const getWeekRange = (weekOffset = 0, setWeekDate) => {
  // Use moment.js for better timezone handling
  const today = moment().add(weekOffset, 'weeks');
  
  // Get Monday of the current week (start of week)
  const firstDay = today.clone().startOf('isoWeek'); // Monday
  const lastDay = today.clone().endOf('isoWeek'); // Sunday

  const options = { month: "short", day: "2-digit" };
  const startText = firstDay.format('MMM DD');
  const endText = lastDay.format('MMM DD');

  setWeekDate(`${startText} - ${endText}`);

  return { 
    start: firstDay.toDate(), 
    end: lastDay.toDate() 
  };
};

// Transform Posts By Week
export const transformPostsByWeek = (posts, weekOffset = 0, setWeekDate) => {
  const { start } = getWeekRange(weekOffset, setWeekDate);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const date = moment(start).add(i, 'days');

    return {
      day: date.format('ddd'), // Mon, Tue...
      date: date.format('YYYY-MM-DD'), // YYYY-MM-DD
      posts: [],
    };
  });

  posts.forEach((post) => {
    // Parse UTC timestamp and convert to local timezone
    const postDate = moment.utc(post.published_at || post.created_at).local();
    // Get local date string (YYYY-MM-DD)
    const key = postDate.format('YYYY-MM-DD');
    
    const targetDay = weekDays.find((day) => day.date === key);
    if (targetDay) {
      targetDay.posts.push(post);
    }
  });

  weekDays.forEach((day) => {
    day.posts.sort(
      (a, b) =>
        moment.utc(a.published_at || a.created_at).local() -
        moment.utc(b.published_at || b.created_at).local()
    );
  });

  return weekDays;
};

// transform Drafts by week

export const transformDraftsByWeek = (posts, weekOffset = 0, setWeekDate) => {
  const { start, end } = getWeekRange(weekOffset, setWeekDate);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const date = moment(start).add(i, 'days');

    return {
      day: date.format('ddd'), // Mon, Tue...
      date: date.format('YYYY-MM-DD'), // YYYY-MM-DD
      posts: [],
    };
  });

  const drafts = [];

  posts.forEach((post) => {
    // Parse UTC timestamp and convert to local timezone
    const postDate = moment.utc(post.published_at || post.created_at).local();
    // Get local date string (YYYY-MM-DD)
    const key = postDate.format('YYYY-MM-DD');
    
    const targetDay = weekDays.find((day) => day.date === key);

    if (targetDay) {
      targetDay.posts.push(post);
      drafts.push(post);
    }
  });

  weekDays.forEach((day) => {
    day.posts.sort(
      (a, b) =>
        moment.utc(a.published_at || a.created_at).local() -
        moment.utc(b.published_at || b.created_at).local()
    );
  });

  drafts.sort(
    (a, b) =>
      moment.utc(a.published_at || a.created_at).local() -
      moment.utc(b.published_at || b.created_at).local()
  );

  return { weekDays, drafts };
};

// transform Scheduled Posts by week

export const transformScheduledPostsByWeek = (
  posts,
  weekOffset = 0,
  setWeekDate
) => {
  console.log("posts", posts);
  const { start, end } = getWeekRange(weekOffset, setWeekDate);
  console.log("start=>", start, "End=>", end);
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const date = moment(start).add(i, 'days');
    return {
      day: date.format('ddd'), // Mon, Tue...
      date: date.format('YYYY-MM-DD'), // YYYY-MM-DD
      posts: [],
    };
  });

  const data = [];
  posts.forEach((post) => {
    // Parse UTC timestamp and convert to local timezone
    const postDate = moment.utc(post.scheduled_time).local();
    let same_day = postDate.isSame(start, "day");

    if ((postDate.isSameOrAfter(start) && postDate.isSameOrBefore(end)) || same_day) {
      // Get local date string (YYYY-MM-DD)
      const key = postDate.format('YYYY-MM-DD');
      
      const targetDay = weekDays.find((day) => day.date === key);
      if (targetDay) {
        targetDay.posts.push(post);
        data.push(post);
      }
    }
  });
  weekDays.forEach((day) => {
    day.posts.sort(
      (a, b) => moment.utc(a.scheduled_time).local() - moment.utc(b.scheduled_time).local()
    );
  });
  data.sort((a, b) => moment.utc(a.created_at).local() - moment.utc(b.created_at).local());

  return { weekDays, data };
};
