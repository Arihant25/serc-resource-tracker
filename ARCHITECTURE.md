# SERC Resource Tracker

This is a web app which will be used to track the resources available in SERC, IIIT-H. Researchers can see what resources are available, and reserve them for a set duration.

## Tech Stack

- Frontend and Backend: Next.js
- UI: ShadCN
- Database: MongoDB
- Authentication: Fixed list of users (added by admin) and password
- Deployment: Vercel
- Notifications: Firebase Cloud Messaging and Gmail SMTP server with Vercel Cron Jobs

## Database Schema

```json
{
    "users": [
        {
            "_id": "ObjectId",
            "name": "string",
            "email": "string",
            "password": "string",
            "isAdmin": "boolean",
            "notificationPreferences": {
                "email": "boolean",
                "push": "boolean"
            },
            "fcmTokens": ["array"]
        }
    ],
    "resources": [
        {
            "_id": "ObjectId",
            "name": "string",
            "description": "string",
            "image": "string (2MB max, base64 encoded)",
            "collegeId": "string (optional)",
            "isComputer": "boolean",
            "systemUser": "string (only visible to admins or users with active reservation)",
            "systemIp": "string (only visible to admins or users with active reservation)",
            "password": "string (only visible to admins or users with active reservation)"
        }
    ],
    "reservations": [
        {
            "_id": "ObjectId",
            "resourceId": "ObjectId",
            "userId": "ObjectId",
            "startTime": "Date",
            "endTime": "Date",
            "date_created": "Date",
            "status": "pending|approved|rejected",
            "priority": "urgent|normal",
            "reason": "string"
        }
    ]
}
```

## Screens

1. Landing Page
2. Login Page
3. Dashboard Page
4. Resource Page with Reservation Popup
5. Admin Page
6. Profile Page

### Dashboard Page
It contains the list of all resources, represented as cards. It also shows which ones are available and which ones are not. It should also show the priority of reservation. It should also show when a resource is reserved in the future, and till when.

### Resource Page
It contains the details of a specific resource. It also shows the future reservations and reservation history of the resource for the last 1 year. It has a reserve button that opens a popup to reserve the resource for a set duration, with reason textbox and priority dropdown (Urgent / Normal).

**Computer Resources:** If a resource is marked as a computer, it can optionally have system details (username, IP address, and password) that are only visible to:
- Admins (always visible)
- Users with active approved reservations for that resource

This ensures sensitive information is protected while allowing authorized users to access the system when needed.

### Admin Page
It contains the list of all resources and users.
It has options to add, edit, and remove resources and users.
To add a user, the admin has to provide the name, email, and whether the user is an admin or not.
While logging in for the first time, the user has to provide a password, which is hashed and stored in the DB.

When adding or editing resources, admins can specify:
- Basic info: name, description, image, and college ID (optional)
- Computer settings: toggle if it's a computer resource
- System details (if computer): username, system IP, and password

When a reservation is made, the admin has to approve it.

### Profile Page
The web app has push notifications, and email notifications. They can be enabled/disabled by the user in the profile page. The user can also change their password here.
It also shows their past and current reservations. If a reservation is cancelled, it is deleted from the DB.

## Notifications

Notifications are sent for the following events:
1. Reservation request (to admin)
2. Reservation approval (to requesting user)
3. Reservation rejection (to requesting user)
4. Reservation ending in 1 day reminder (to user who reserved)
5. Reservation started reminder (to user who reserved) - on the morning of reservation

Emails are sent using Gmail SMTP server. Push notifications are sent using Firebase Cloud Messaging.