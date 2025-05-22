/*
  # Initial Schema Setup for CarpoolConnect

  1. Collections
    - users
    - rides
    - requests
    - messages
    - emergencyAlerts
    - emergencyContacts (subcollection under users)

  2. Security Rules
    - All collections have authentication required
    - Users can read/write their own data
    - Drivers can manage their rides
    - Passengers can request rides and send messages
*/

// Users Collection
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid",
        "emergencyContacts": {
          ".read": "auth != null && auth.uid == $uid",
          ".write": "auth != null && auth.uid == $uid"
        }
      }
    },
    "rides": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$rideId": {
        ".read": "auth != null",
        ".write": "auth != null && (resource.data.driverId == auth.uid || !resource.data)"
      }
    },
    "requests": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$requestId": {
        ".read": "auth != null && (resource.data.userId == auth.uid || resource.parent().parent().child('rides').child(resource.data.rideId).child('driverId').val() == auth.uid)",
        ".write": "auth != null && (resource.data.userId == auth.uid || !resource.data)"
      }
    },
    "messages": {
      "$messageId": {
        ".read": "auth != null && (resource.data.senderId == auth.uid || resource.parent().parent().child('rides').child(resource.data.rideId).child('driverId').val() == auth.uid)",
        ".write": "auth != null"
      }
    },
    "emergencyAlerts": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$alertId": {
        ".read": "auth != null && resource.data.userId == auth.uid",
        ".write": "auth != null && (resource.data.userId == auth.uid || !resource.data)"
      }
    }
  }
}