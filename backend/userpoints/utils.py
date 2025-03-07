from .models import UserPoints, UserActivity
def assign_badge(user):
    """Assigns a badge based on points"""
    user_points = UserPoints.objects.get(user=user)

    badge_awards = [
        (50, "Balanced Thinker"),
        (100, "Curious Mind"),
        (200, "Critical Thinker"),
        (500, "Master Explorer"),
    ]

    new_badges = []
    for threshold, badge in badge_awards:
        if user_points.total_points >= threshold and badge not in user_points.badges:
            user_points.badges.append(badge)
            new_badges.append(badge)

    user_points.save()
    return new_badges

def add_user_points(user, action):
    """Handles awarding points and badges based on user actions"""
    points_mapping = {
        "article_view": 5,
        "alternative_click": 10,
        "quiz_attempt": 15,
        "quiz_score_high": 20,
    }

    points = points_mapping.get(action, 0)
    if points == 0:
        return {"message": "Invalid action"}

    user_points, created = UserPoints.objects.get_or_create(user=user)
    user_points.total_points += points
    user_points.save()

    # Log user activity
    UserActivity.objects.create(user=user, action=action, points_awarded=points)

    # Check if new badges should be assigned
    new_badges = assign_badge(user)
    return {"points": user_points.total_points, "new_badges": new_badges}
