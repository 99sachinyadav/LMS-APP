import humanizeDuration from "humanize-duration";

export const calculateRating = (course) => {
  if (!course?.courseRating?.length) return 0;
  const total = course.courseRating.reduce(
    (sum, rating) => sum + (rating?.rating || 0),
    0,
  );
  return Math.floor(total / course.courseRating.length);
};

export const calculateNoOfLectures = (course) => {
  if (!course?.courseContent?.length) return 0;
  return course.courseContent.reduce((sum, chapter) => {
    const count = Array.isArray(chapter?.chapterContent)
      ? chapter.chapterContent.length
      : 0;
    return sum + count;
  }, 0);
};

export const calculateChapterTime = (chapter) => {
  const total = (chapter?.chapterContent || []).reduce(
    (sum, lecture) => sum + (lecture?.lectureDuration || 0),
    0,
  );
  return humanizeDuration(total * 60 * 1000, { units: ["h", "m"] });
};

export const calculateCourseDuration = (course) => {
  const total = (course?.courseContent || []).reduce((sum, chapter) => {
    return (
      sum +
      (chapter?.chapterContent || []).reduce(
        (inner, lecture) => inner + (lecture?.lectureDuration || 0),
        0,
      )
    );
  }, 0);
  return humanizeDuration(total * 60 * 1000, { units: ["h", "m"] });
};

export const extractYouTubeVideoId = (url = "") => {
  if (!url) return "";
  const directId = url.match(/^[a-zA-Z0-9_-]{11}$/);
  if (directId) return url;
  const vParam = url.match(/[?&]v=([^&]+)/);
  if (vParam?.[1]) return vParam[1];
  const shortLink = url.match(/youtu\.be\/([^?&/]+)/);
  if (shortLink?.[1]) return shortLink[1];
  const embed = url.match(/embed\/([^?&/]+)/);
  if (embed?.[1]) return embed[1];
  return "";
};
