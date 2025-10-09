# Gamification Features - Future Roadmap

## Overview

This document outlines gamification features planned for **future releases** (Phase 2+). These features enhance user engagement and motivation through achievements, competition, and recognition.

> **Note**: Phase 1 focuses on Learning Progress Notifications. Gamification features are documented here for future planning but are NOT part of the current release.

---

## Phase 2: Badges & Achievements (Q2 2026)

### Features
- Badge system with tiers (Bronze, Silver, Gold, Platinum)
- Achievement tracking and showcasing
- Points/XP system
- Achievement showcase on user profile
- Badge collection view

### Notification Types
- `badge_earned` - When user earns a badge
- `milestone_reached` - Significant milestones
- `achievement_unlocked` - Special achievements
- `points_milestone` - Reached point milestones (100, 500, 1000, etc.)

### Badges Catalog

#### Learning Milestones
- **First Steps** (Bronze) - Complete your first lesson
- **Getting Started** (Bronze) - Complete 5 lessons
- **Dedicated Learner** (Silver) - Complete 25 lessons
- **Committed Student** (Gold) - Complete 50 lessons
- **Expert Learner** (Platinum) - Complete 100 lessons

#### Quiz Performance
- **Perfect Score** (Bronze) - Score 100% on any quiz
- **First Try Pro** (Silver) - Pass 5 quizzes on first attempt
- **Quiz Master** (Gold) - Maintain 90%+ average on 10 quizzes
- **Quiz Legend** (Platinum) - Perfect scores on 10 quizzes

#### Speed & Efficiency
- **Fast Learner** (Bronze) - Complete 5 lessons in one day
- **Speed Runner** (Silver) - Complete a track in under 7 days
- **Efficiency Expert** (Gold) - Complete 3 tracks in under 30 days

#### Track Completion
- **Track Starter** (Bronze) - Complete first learning track
- **Track Enthusiast** (Silver) - Complete 3 learning tracks
- **Track Veteran** (Gold) - Complete 10 learning tracks
- **Track Legend** (Platinum) - Complete 25 learning tracks

### Points System
```
Actions and Points:
- Complete Lesson: 10 points
- Pass Quiz (70-79%): 15 points
- Pass Quiz (80-89%): 20 points
- Pass Quiz (90-99%): 25 points
- Perfect Quiz (100%): 50 points
- First Attempt Pass (bonus): +10 points
- Complete Learning Track: 100 points
- Earn Bronze Badge: 25 points
- Earn Silver Badge: 50 points
- Earn Gold Badge: 100 points
- Earn Platinum Badge: 250 points
```

### Database Schema (Phase 2)
```sql
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  achievement_type TEXT NOT NULL, -- 'badge', 'milestone'
  achievement_name TEXT NOT NULL,
  achievement_tier TEXT, -- 'bronze', 'silver', 'gold', 'platinum'
  
  description TEXT,
  icon_url TEXT,
  points_awarded INTEGER DEFAULT 0,
  
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB, -- {"quiz_score": 100, "lesson_count": 5}
  
  notification_sent BOOLEAN DEFAULT false,
  notified_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_user_achievement 
    UNIQUE(user_id, achievement_type, achievement_name)
);

CREATE TABLE public.user_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  points_this_week INTEGER DEFAULT 0,
  points_this_month INTEGER DEFAULT 0,
  last_points_awarded_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Phase 3: Streaks & Consistency (Q3 2026)

### Features
- Daily streak tracking
- Streak milestones with notifications
- Streak calendar view
- Streak recovery ("freeze days")
- Longest streak tracking

### Notification Types
- `streak_milestone` - Reached 3, 7, 14, 30, 60, 100, 365 day streaks
- `streak_at_risk` - Haven't logged in today (end of day reminder)
- `streak_recovered` - Used a freeze day
- `streak_broken` - Streak ended (motivational)
- `new_longest_streak` - Beat previous record

### Streak Milestones
- **3 Days** - "Week Starter" (25 points)
- **7 Days** - "Week Warrior" (75 points)
- **14 Days** - "Two Week Champion" (150 points)
- **30 Days** - "Month Master" (300 points)
- **60 Days** - "Consistency King" (600 points)
- **100 Days** - "Century Club" (1000 points)
- **365 Days** - "Year Hero" (5000 points)

### Streak Protection
- Users earn 1 "freeze day" for every 7-day streak
- Freeze days automatically protect streaks when user misses a day
- Maximum 3 freeze days stored

### Database Schema (Phase 3)
```sql
CREATE TABLE public.user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  
  last_activity_date DATE,
  streak_start_date DATE,
  
  freeze_days_available INTEGER DEFAULT 0,
  freeze_days_used INTEGER DEFAULT 0,
  
  -- Milestone tracking
  milestone_3_day BOOLEAN DEFAULT false,
  milestone_7_day BOOLEAN DEFAULT false,
  milestone_14_day BOOLEAN DEFAULT false,
  milestone_30_day BOOLEAN DEFAULT false,
  milestone_60_day BOOLEAN DEFAULT false,
  milestone_100_day BOOLEAN DEFAULT false,
  milestone_365_day BOOLEAN DEFAULT false,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  streak_days INTEGER NOT NULL,
  started_at DATE NOT NULL,
  ended_at DATE,
  
  broken BOOLEAN DEFAULT false,
  freeze_used BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Phase 4: Leaderboards & Rankings (Q4 2026)

### Features
- Global leaderboard
- Department/location leaderboards
- Weekly/monthly/all-time rankings
- Ranking history and trends
- Friendly competition notifications

### Leaderboard Categories
1. **Total Points** - Overall points earned
2. **Lessons Completed** - Total lessons finished
3. **Quiz Performance** - Average quiz scores
4. **Current Streak** - Active learning streaks
5. **Tracks Completed** - Total tracks finished
6. **This Week** - Points earned this week
7. **This Month** - Points earned this month

### Notification Types
- `ranking_improved` - Moved up in rankings
- `ranking_milestone` - Entered top 10, top 50, top 100
- `overtaken` - Someone passed you (motivational)
- `department_leader` - #1 in your department
- `location_leader` - #1 in your location
- `weekly_winner` - Most points this week
- `monthly_champion` - Most points this month

### Database Schema (Phase 4)
```sql
CREATE TABLE public.user_leaderboard (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Overall Stats
  total_points INTEGER DEFAULT 0,
  lessons_completed INTEGER DEFAULT 0,
  tracks_completed INTEGER DEFAULT 0,
  quizzes_passed INTEGER DEFAULT 0,
  average_quiz_score NUMERIC(5,2),
  current_streak_days INTEGER DEFAULT 0,
  
  -- Weekly Stats
  points_this_week INTEGER DEFAULT 0,
  lessons_this_week INTEGER DEFAULT 0,
  week_start_date DATE,
  
  -- Monthly Stats
  points_this_month INTEGER DEFAULT 0,
  lessons_this_month INTEGER DEFAULT 0,
  month_start_date DATE,
  
  -- Rankings
  global_rank INTEGER,
  department_rank INTEGER,
  location_rank INTEGER,
  
  previous_global_rank INTEGER,
  previous_department_rank INTEGER,
  previous_location_rank INTEGER,
  
  rank_change_global INTEGER, -- +/- from last calculation
  rank_change_department INTEGER,
  rank_change_location INTEGER,
  
  -- Metadata
  department_id UUID,
  location_id UUID,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_valid_scores CHECK (
    average_quiz_score >= 0 AND average_quiz_score <= 100
  )
);

-- Views for different leaderboards
CREATE VIEW public.global_leaderboard AS
SELECT 
  ul.user_id,
  p.full_name,
  ul.total_points,
  ul.global_rank,
  ul.rank_change_global,
  ul.lessons_completed,
  ul.average_quiz_score,
  ul.current_streak_days
FROM public.user_leaderboard ul
JOIN public.profiles p ON ul.user_id = p.id
ORDER BY ul.total_points DESC;

CREATE VIEW public.weekly_leaderboard AS
SELECT 
  ul.user_id,
  p.full_name,
  ul.points_this_week,
  ROW_NUMBER() OVER (ORDER BY ul.points_this_week DESC) as weekly_rank,
  ul.lessons_this_week
FROM public.user_leaderboard ul
JOIN public.profiles p ON ul.user_id = p.id
ORDER BY ul.points_this_week DESC;
```

---

## Phase 5: Certificates & Recognition (Q1 2027)

### Features
- Automated certificate generation
- Certificate templates
- Digital certificate storage
- Certificate verification
- Expiry tracking and notifications
- Recertification workflows
- "Learner of the Week/Month" recognition

### Notification Types
- `certificate_issued` - Certificate ready for download
- `certificate_expiring` - Certificate expiring in 30/60/90 days
- `recertification_due` - Time to recertify
- `recertification_completed` - Recertification successful
- `featured_learner` - Featured as learner of week/month
- `manager_recognition` - Manager/admin gave recognition

### Certificate Types
1. **Course Certificates** - Upon track completion
2. **Quiz Certificates** - Perfect quiz scores
3. **Milestone Certificates** - Achievement milestones
4. **Annual Certificates** - Year of continuous learning

### Database Schema (Phase 5)
```sql
-- Extend existing certificates table
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS
  certificate_type TEXT DEFAULT 'course', -- 'course', 'quiz', 'milestone', 'annual'
  points_value INTEGER DEFAULT 100,
  expiry_enabled BOOLEAN DEFAULT false,
  recertification_required BOOLEAN DEFAULT false,
  recertification_interval_months INTEGER;

CREATE TABLE public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  certificate_type TEXT NOT NULL,
  template_html TEXT NOT NULL,
  template_variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.featured_learners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  feature_type TEXT NOT NULL, -- 'week', 'month', 'quarter', 'year'
  feature_date DATE NOT NULL,
  reason TEXT,
  points_awarded INTEGER DEFAULT 500,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, feature_type, feature_date)
);
```

---

## Phase 6: Social & Peer Recognition (Q2 2027)

### Features
- Peer kudos/recognition
- Team challenges
- Department competitions
- Social sharing of achievements
- Activity feed
- Collaboration badges

### Notification Types
- `peer_kudos` - Received kudos from colleague
- `team_challenge_started` - New team challenge
- `team_challenge_won` - Your team won
- `achievement_shared` - Someone shared achievement
- `collaboration_badge` - Earned collaboration badge

### Database Schema (Phase 6)
```sql
CREATE TABLE public.peer_recognition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id),
  to_user_id UUID NOT NULL REFERENCES auth.users(id),
  recognition_type TEXT, -- 'kudos', 'helpful', 'team_player'
  message TEXT,
  points_awarded INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.team_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT, -- 'department', 'location', 'custom'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_metric TEXT, -- 'lessons_completed', 'total_points', etc.
  target_value INTEGER,
  prize_description TEXT,
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Implementation Timeline

### 2026
- **Q2**: Badges & Achievements (Phase 2)
- **Q3**: Streaks & Consistency (Phase 3)
- **Q4**: Leaderboards & Rankings (Phase 4)

### 2027
- **Q1**: Certificates & Recognition (Phase 5)
- **Q2**: Social & Peer Recognition (Phase 6)

---

## Notification Template Examples (Future)

### Badge Earned
```html
Subject: 🏆 Achievement Unlocked: {{badge_name}}!

<div style="font-family: Arial, sans-serif;">
  <h1>🏆 {{achievement_tier}} Badge Earned!</h1>
  <img src="{{badge_icon}}" alt="{{badge_name}}" style="width: 150px;" />
  
  <h2>{{badge_name}}</h2>
  <p>{{badge_description}}</p>
  
  <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px;">
    <p><strong>Points Earned:</strong> +{{points_awarded}}</p>
    <p><strong>Total Points:</strong> {{total_points}}</p>
    <p><strong>Badges Earned:</strong> {{total_badges}}</p>
  </div>
  
  <a href="{{profile_url}}">View All Your Achievements</a>
</div>
```

### Ranking Improved
```html
Subject: 📈 You climbed to #{{new_rank}}!

<div style="font-family: Arial, sans-serif;">
  <h1>📈 Great Progress!</h1>
  
  <p>You've moved from <strong>#{{old_rank}}</strong> to 
     <strong style="color: #22c55e; font-size: 24px;">#{{new_rank}}</strong>!</p>
  
  <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px;">
    <h3>Your Stats</h3>
    <p><strong>Total Points:</strong> {{total_points}}</p>
    <p><strong>Lessons Completed:</strong> {{lessons_completed}}</p>
    <p><strong>Current Streak:</strong> {{current_streak}} days 🔥</p>
  </div>
  
  <p>Keep learning to reach the top 10!</p>
  <a href="{{leaderboard_url}}">View Leaderboard</a>
</div>
```

### Streak Milestone
```html
Subject: 🔥 {{streak_days}}-Day Streak! You're on fire!

<div style="font-family: Arial, sans-serif;">
  <h1>🔥 {{streak_days}}-Day Learning Streak!</h1>
  
  <p>Amazing, {{user_name}}! You've learned for {{streak_days}} days in a row!</p>
  
  <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px;">
    <p><strong>Points Earned:</strong> +{{streak_points}}</p>
    <p><strong>Freeze Days Available:</strong> {{freeze_days}}</p>
    <p><strong>Longest Streak:</strong> {{longest_streak}} days</p>
  </div>
  
  <p>Don't break your streak - complete today's lesson!</p>
  <a href="{{dashboard_url}}">Continue Learning</a>
</div>
```

---

## Success Metrics (Future)

### Key Performance Indicators
- **Engagement Rate**: % increase in daily active users
- **Completion Rate**: % increase in course completions
- **Retention**: % reduction in user churn
- **Time on Platform**: Average session duration increase
- **Social Sharing**: Number of achievements shared

### Target Goals (Post-Gamification)
- 40% increase in lesson completion rates
- 30% increase in daily active users
- 50% increase in learning track completions
- 25% reduction in user inactivity
- 60% of users earning at least one badge per month

---

## References & Inspiration

- Duolingo's streak system
- LinkedIn Learning's skill badges
- Codecademy's achievement system
- Khan Academy's energy points
- Coursera's certificates and specializations

---

**Last Updated**: October 8, 2025  
**Version**: 1.0.0  
**Status**: Roadmap - Future Phases
