# Batter App Backend Testing (Postman)

This guide matches the full testing flow you listed and is ready to import into Postman.

## Files
- Collection: postman/BatterApp.postman_collection.json
- Environment: postman/BatterApp.postman_environment.json

## Import
1. Open Postman.
2. Import both JSON files.
3. Select environment: "Batter App Local".

## Run Order (Collection)
1. Send OTP
2. Verify OTP (copies token to env)
3. Get User Profile
4. Add Address
5. Zone Detection (copies zoneId)
6. Get Products (copies productId)
7. Slot Availability (copies slotId)
8. Create Order (copies orderId)
9. Get Order Status

## Required Manual Step
- After "Send OTP", copy the OTP from the server terminal logs and paste it into env var `otp`.

## Notes
- Protected routes already use Bearer token from env var `token`.
- Update `date` to the day you want to test slot availability.
- If slot availability is empty, ensure slots, zone, and stock exist for that date.
