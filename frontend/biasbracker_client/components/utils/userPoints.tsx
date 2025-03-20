import { useAddUserPointsMutation } from "@/redux/features/userPointsApiSlice";
import { toast } from "react-hot-toast";

const [addUserPoints] = useAddUserPointsMutation();

// ✅ Call this when the user reads an article
export const handleArticleView = async () => {
  await addUserPoints("article_view")
    .unwrap()
    .then((res) => {
      toast.success("+5 Points for reading!");
      if (res.new_badges.length > 0) {
        toast.success(`🏅 New Badge Earned: ${res.new_badges.join(", ")}`);
      }
    })
    .catch(() => toast.error("Failed to update points."));
};

// ✅ Call this when the user views an alternative perspective
export const handleAlternativeClick = async () => {
  await addUserPoints("alternative_click")
    .unwrap()
    .then((res) => {
      toast.success("+10 Points for exploring different views!");
      if (res.new_badges.length > 0) {
        toast.success(`🏅 New Badge Earned: ${res.new_badges.join(", ")}`);
      }
    })
    .catch(() => toast.error("Failed to update points."));
};

// ✅ Call this when user completes a quiz with a high score
export const handleQuizCompletion = async (score: number) => {
  if (score >= 80) {
    await addUserPoints("quiz_score_high")
      .unwrap()
      .then((res) => {
        toast.success("+20 Points! You earned a badge!");
        if (res.new_badges.length > 0) {
          toast.success(`🏅 New Badge Earned: ${res.new_badges.join(", ")}`);
        }
      })
      .catch(() => toast.error("Failed to update points."));
  }
};
