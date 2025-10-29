# 📊 Data Format Specification

This document describes the JSON format expected by ConvoHelper Standalone Edition.

## Overview

ConvoHelper expects a specific JSON structure that contains conversation history between multiple participants. The format is designed to be flexible while maintaining consistency.

## Basic Structure

```json
{
  "Direct Message": {
    "Direct Messages": {
      "ChatHistory": {
        "Chat History with [participant_name]:": [
          /* array of message objects */
        ]
      }
    }
  }
}
```

## Complete Example

```json
{
  "Direct Message": {
    "Direct Messages": {
      "ChatHistory": {
        "Chat History with alice_2024:": [
          {
            "Date": "2025-10-26 17:35:24",
            "From": "alice_2024",
            "Content": "Hello! How are you?"
          },
          {
            "Date": "2025-10-26 17:36:10",
            "From": "bob_user",
            "Content": "I'm good, thanks! 😊"
          },
          {
            "Date": "2025-10-26 17:37:05",
            "From": "alice_2024",
            "Content": "[https://example.com/image.jpg]"
          }
        ],
        "Chat History with charlie_123:": [
          {
            "Date": "2025-10-25 10:20:15",
            "From": "charlie_123",
            "Content": "Hey there!"
          },
          {
            "Date": "2025-10-25 10:21:30",
            "From": "bob_user",
            "Content": "Hi Charlie!"
          }
        ]
      }
    }
  }
}
```

## Field Specifications

### Root Level

```json
{
  "Direct Message": { /* required */ }
}
```

- **`Direct Message`**: Required root key
- **Type**: Object
- **Purpose**: Container for all messaging data

### Second Level

```json
{
  "Direct Message": {
    "Direct Messages": { /* required */ }
  }
}
```

- **`Direct Messages`**: Required second-level key
- **Type**: Object
- **Purpose**: Container for chat history

### Third Level

```json
{
  "Direct Message": {
    "Direct Messages": {
      "ChatHistory": { /* required */ }
    }
  }
}
```

- **`ChatHistory`**: Required third-level key
- **Type**: Object
- **Purpose**: Contains all individual conversations
- **Keys**: Must follow pattern `"Chat History with [name]:"`

### Conversation Keys

```json
{
  "ChatHistory": {
    "Chat History with alice_2024:": [ /* array of messages */ ]
  }
}
```

- **Pattern**: `"Chat History with [participant_name]:"`
- **Note**: Must end with a colon `:`
- **participant_name**: Can contain:
  - Letters (a-z, A-Z)
  - Numbers (0-9)
  - Underscores (_)
  - Dots (.)
  - Hyphens (-)

### Message Objects

Each message in the array must have these fields:

```json
{
  "Date": "2025-10-26 17:35:24",
  "From": "alice_2024",
  "Content": "Hello!"
}
```

#### Date Field
- **Key**: `"Date"`
- **Type**: String
- **Format**: `"YYYY-MM-DD HH:MM:SS"`
- **Required**: Yes
- **Examples**:
  - `"2025-10-26 17:35:24"`
  - `"2025-01-01 00:00:00"`
  - `"2025-12-31 23:59:59"`

#### From Field
- **Key**: `"From"`
- **Type**: String
- **Required**: Yes
- **Purpose**: Identifies the message sender
- **Note**: Should match participant name or be another participant

#### Content Field
- **Key**: `"Content"`
- **Type**: String
- **Required**: Yes
- **Purpose**: The actual message content
- **Special Cases**:
  - URLs: `"[https://example.com/image.jpg]"`
  - Stickers: `"[https://media.tenor.com/xyz.webp]"`
  - Empty messages: `""` (allowed but will be counted)
  - Long text: No limit, but very long messages may affect performance

## Special Content Types

### Links
```json
{
  "Content": "[https://example.com/page]"
}
```
- Detected when content starts with `[http` or `[https`
- Will be marked as "Link" in statistics

### Stickers/GIFs
```json
{
  "Content": "[https://media.tenor.com/abc123.webp]"
}
```
- Detected when content contains media URLs
- Common patterns: `.webp`, `.gif`, `.jpg`, `.png`
- Will be marked as "Sticker" in statistics

### Plain Text
```json
{
  "Content": "Just a regular message 😊"
}
```
- Any content that doesn't match special patterns
- Can include emojis and special characters

## Validation Rules

### Required Structure
✅ Must have `Direct Message` → `Direct Messages` → `ChatHistory` hierarchy
✅ Each conversation key must follow `"Chat History with [name]:"` pattern
✅ Each message must have `Date`, `From`, and `Content` fields

### Optional Elements
⚠️ Additional fields in message objects will be ignored
⚠️ Additional top-level keys will be ignored
⚠️ Empty conversation arrays are allowed (but won't be processed)

### Common Errors

#### Error: "Invalid JSON structure"
```json
{
  // Missing required hierarchy
  "ChatHistory": { ... }
}
```
**Fix**: Wrap in proper structure

#### Error: "Invalid conversation key format"
```json
{
  "ChatHistory": {
    "alice_2024": [ ... ]  // Missing "Chat History with" prefix
  }
}
```
**Fix**: Use `"Chat History with alice_2024:"`

#### Error: "Missing required field"
```json
{
  "Date": "2025-10-26 17:35:24",
  "From": "alice_2024"
  // Missing "Content" field
}
```
**Fix**: Add all required fields

## Date Handling

### Supported Formats

Primary format (recommended):
```
"YYYY-MM-DD HH:MM:SS"
Example: "2025-10-26 17:35:24"
```

Also supported:
```
"YYYY-MM-DDTHH:MM:SS"
Example: "2025-10-26T17:35:24"

"YYYY-MM-DD HH:MM:SS.mmm"
Example: "2025-10-26 17:35:24.123"
```

### Timezone Handling
- Dates are processed as-is
- No timezone conversion is performed
- Ensure consistency within your dataset

### Date Validation
- Year: 1970-2100
- Month: 01-12
- Day: 01-31 (validated against month)
- Hour: 00-23
- Minute: 00-59
- Second: 00-59

## Size Limitations

### Recommended Limits
- **File Size**: Up to 50MB
- **Messages**: Up to 100,000 messages
- **Conversations**: Up to 100 participants

### Performance Considerations
- Larger files take longer to process
- Browser memory limits may affect very large files
- Consider splitting large datasets by time period

## Creating Valid JSON

### From Scratch
```javascript
// Example: Creating valid structure
const data = {
  "Direct Message": {
    "Direct Messages": {
      "ChatHistory": {}
    }
  }
};

// Add conversations
data["Direct Message"]["Direct Messages"]["ChatHistory"]["Chat History with alice:"] = [
  {
    "Date": "2025-10-26 17:35:24",
    "From": "alice",
    "Content": "Hello!"
  }
];
```

### Converting from Other Formats

#### From CSV
```python
import csv
import json
from datetime import datetime

# Read CSV with columns: date, from, to, message
conversations = {}
with open('messages.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        participant = row['to']
        key = f"Chat History with {participant}:"
        if key not in conversations:
            conversations[key] = []
        
        conversations[key].append({
            "Date": row['date'],
            "From": row['from'],
            "Content": row['message']
        })

# Create structure
output = {
    "Direct Message": {
        "Direct Messages": {
            "ChatHistory": conversations
        }
    }
}

# Save
with open('output.json', 'w') as f:
    json.dump(output, f, indent=2)
```

## Validation Script

Use this Python script to validate your JSON:

```python
import json
import sys
from datetime import datetime

def validate_json(filepath):
    """Validate ConvoHelper JSON format"""
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        # Check structure
        if "Direct Message" not in data:
            return False, "Missing 'Direct Message' key"
        
        if "Direct Messages" not in data["Direct Message"]:
            return False, "Missing 'Direct Messages' key"
        
        if "ChatHistory" not in data["Direct Message"]["Direct Messages"]:
            return False, "Missing 'ChatHistory' key"
        
        chat_history = data["Direct Message"]["Direct Messages"]["ChatHistory"]
        
        # Check conversations
        total_messages = 0
        for key, messages in chat_history.items():
            if not key.startswith("Chat History with "):
                return False, f"Invalid conversation key: {key}"
            
            if not key.endswith(":"):
                return False, f"Conversation key must end with colon: {key}"
            
            # Check messages
            for i, msg in enumerate(messages):
                if "Date" not in msg:
                    return False, f"Message {i} missing 'Date' field in {key}"
                
                if "From" not in msg:
                    return False, f"Message {i} missing 'From' field in {key}"
                
                if "Content" not in msg:
                    return False, f"Message {i} missing 'Content' field in {key}"
                
                # Validate date format
                try:
                    datetime.strptime(msg["Date"], "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    return False, f"Invalid date format in message {i}: {msg['Date']}"
                
                total_messages += 1
        
        return True, f"Valid! Found {len(chat_history)} conversations, {total_messages} messages"
    
    except json.JSONDecodeError as e:
        return False, f"Invalid JSON: {e}"
    except Exception as e:
        return False, f"Error: {e}"

# Usage
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate.py <json_file>")
        sys.exit(1)
    
    valid, message = validate_json(sys.argv[1])
    print("✅" if valid else "❌", message)
    sys.exit(0 if valid else 1)
```

Save as `validate.py` and run:
```bash
python validate.py your_data.json
```

## Examples

### Minimal Valid File
```json
{
  "Direct Message": {
    "Direct Messages": {
      "ChatHistory": {
        "Chat History with test:": [
          {
            "Date": "2025-01-01 12:00:00",
            "From": "test",
            "Content": "Hello"
          }
        ]
      }
    }
  }
}
```

### Multiple Conversations
```json
{
  "Direct Message": {
    "Direct Messages": {
      "ChatHistory": {
        "Chat History with alice:": [
          {
            "Date": "2025-01-01 12:00:00",
            "From": "alice",
            "Content": "Hi!"
          }
        ],
        "Chat History with bob:": [
          {
            "Date": "2025-01-02 14:30:00",
            "From": "bob",
            "Content": "Hey there!"
          }
        ]
      }
    }
  }
}
```

---

## Need Help?

- Check `examples/sample_data.json` for a working example
- Use the validation script above to check your files
- See USAGE.md for how to use the data once uploaded

---

*Last updated: October 2025*
