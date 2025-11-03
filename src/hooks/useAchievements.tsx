import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AchievementType = 
  | "welcome" // Bem-vindo ao Portella!
  | "first_scrap" // Primeiro Recado
  | "photographer" // Fotógrafo
  | "decorator" // Decorador
  | "musician" // Músico
  | "writer" // Escritor
  | "social" // Socialite
  | "friendly" // Amigável
  | "commentator" // Comentarista
  | "collector" // Colecionador
  | "popular" // Popular
  | "influencer" // Influencer
  | "engaged" // Engajado
  | "explorer" // Explorador
  | "cinephile"; // Cinéfilo

const achievementMapping: Record<AchievementType, string> = {
  welcome: "Bem-vindo ao Portella!",
  first_scrap: "Primeiro Recado",
  photographer: "Fotógrafo",
  decorator: "Decorador",
  musician: "Músico",
  writer: "Escritor",
  social: "Socialite",
  friendly: "Amigável",
  commentator: "Comentarista",
  collector: "Colecionador",
  popular: "Popular",
  influencer: "Influencer",
  engaged: "Engajado",
  explorer: "Explorador",
  cinephile: "Cinéfilo",
};

export const useAchievements = () => {
  const grantAchievement = async (userId: string, achievementType: AchievementType) => {
    try {
      // Get the achievement by name
      const { data: achievement, error: achievementError } = await supabase
        .from("achievements")
        .select("*")
        .eq("name", achievementMapping[achievementType])
        .single();

      if (achievementError || !achievement) {
        console.error("Achievement not found:", achievementType);
        return;
      }

      // Check if user already has this achievement
      const { data: existing } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", userId)
        .eq("achievement_id", achievement.id)
        .single();

      if (existing) {
        // User already has this achievement
        return;
      }

      // Grant the achievement
      const { error: grantError } = await supabase
        .from("user_achievements")
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
        });

      if (grantError) throw grantError;

      // Update user points - get current points first
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", userId)
        .single();

      if (currentProfile) {
        const { error: pointsError } = await supabase
          .from("profiles")
          .update({
            points: (currentProfile.points || 0) + achievement.points,
          })
          .eq("id", userId);

        if (pointsError) throw pointsError;
      }

      // Show achievement notification
      toast.success(`🏆 Novo Troféu Desbloqueado!`, {
        description: `${achievement.name} (+${achievement.points} pontos)`,
        duration: 5000,
      });

      // Check for "Colecionador" achievement (5 achievements)
      if (achievementType !== "collector") {
        const { data: userAchievements } = await supabase
          .from("user_achievements")
          .select("*")
          .eq("user_id", userId);

        if (userAchievements && userAchievements.length >= 5) {
          await grantAchievement(userId, "collector");
        }
      }
    } catch (error) {
      console.error("Error granting achievement:", error);
    }
  };

  const checkFirstScrap = async (userId: string) => {
    const { data } = await supabase
      .from("scraps")
      .select("id")
      .eq("from_user_id", userId)
      .limit(1);

    if (data && data.length === 1) {
      await grantAchievement(userId, "first_scrap");
    }
  };

  const checkPhotographer = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (profile?.avatar_url) {
      await grantAchievement(userId, "photographer");
    }
  };

  const checkDecorator = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("house_background")
      .eq("id", userId)
      .single();

    if (profile?.house_background) {
      await grantAchievement(userId, "decorator");
    }
  };

  const checkMusician = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("house_music")
      .eq("id", userId)
      .single();

    if (profile?.house_music) {
      await grantAchievement(userId, "musician");
    }
  };

  const checkWriter = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("bio")
      .eq("id", userId)
      .single();

    if (profile?.bio && profile.bio.length >= 20) {
      await grantAchievement(userId, "writer");
    }
  };

  const checkFirstPost = async (userId: string) => {
    const { data } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (data && data.length === 1) {
      await grantAchievement(userId, "social");
    }
  };

  return {
    grantAchievement,
    checkFirstScrap,
    checkPhotographer,
    checkDecorator,
    checkMusician,
    checkWriter,
    checkFirstPost,
  };
};
