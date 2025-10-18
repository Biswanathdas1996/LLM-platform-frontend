# Quick Test: Document Names UI Display

## Test the New Feature

### 1. Start the Backend Server
```bash
cd C:\Users\daspa\Desktop\LocalLlmHost\backend
python main.py
```

### 2. Start the Frontend Dev Server
```bash
cd C:\Users\daspa\Desktop\LocalLlmHost
npm run dev
```

### 3. Test Steps

#### A. Navigate to BYOD Page
1. Open browser to `http://localhost:5173` (or the port shown)
2. Click "BYOD - Bring Your Own Data" in the navigation menu

#### B. Create a Test Index
1. Click the "Manage Indexes" tab
2. Enter index name: `test_medical`
3. Click "Create" button

#### C. Upload Test Documents
1. Click the "Upload Documents" tab
2. Select index: `test_medical`
3. Create two test files on your desktop:
   - `patient_records.txt` - Add some text about patient care
   - `treatment_guidelines.txt` - Add some text about treatments
4. Click "Select Files" and choose both files
5. Click "Upload Documents"
6. Wait for success message

#### D. View Documents in Index List
1. Click the "Manage Indexes" tab again
2. Look at the `test_medical` index card
3. **You should now see:**
   ```
   test_medical
   2 docs | 2 chunks | X.X KB
   
   Documents:
   [📄 patient_records.txt] [📄 treatment_guidelines.txt]
   ```

### Expected Result

The index card should show:
- ✅ Index name at the top
- ✅ Stats row showing document count, chunks, and size
- ✅ "Documents:" label
- ✅ Each document displayed as a badge with file icon
- ✅ Clean, organized layout

### What to Look For

**Visual Elements:**
- Document badges should have subtle outline borders
- File icon (📄) before each filename
- Badges wrap to new line if needed
- Clean spacing between badges
- Muted "Documents:" label

**Functionality:**
- Documents appear immediately after upload
- Multiple documents display side by side
- Layout doesn't break with many documents
- Delete button still accessible on the right

### Troubleshooting

**If documents don't appear:**
1. Check browser console for errors
2. Verify backend API is running on port 5000
3. Check network tab - API response should include `documents` array
4. Try refreshing the page

**If layout looks wrong:**
1. Clear browser cache
2. Check that Tailwind CSS is loaded
3. Verify no CSS conflicts

### Quick API Test

You can also test the API directly:
```bash
# Create index
curl -X POST http://localhost:5000/api/rag/indexes \
  -H "Content-Type: application/json" \
  -d '{"index_name": "test_api"}'

# Upload a document
curl -X POST http://localhost:5000/api/rag/upload \
  -F "index_name=test_api" \
  -F "files=@patient_records.txt"

# List indexes (should show documents)
curl http://localhost:5000/api/rag/indexes
```

The last command should return:
```json
{
  "indexes": [
    {
      "name": "test_api",
      "documents": ["patient_records.txt"],
      ...
    }
  ]
}
```

### Screenshot Checklist

When viewing the UI, verify:
- [ ] Index name is clearly visible
- [ ] Stats are displayed correctly (docs, chunks, size)
- [ ] "Documents:" label appears
- [ ] Each document shown as a badge
- [ ] File icon visible in each badge
- [ ] Badges are properly spaced
- [ ] Delete button still accessible
- [ ] Layout is responsive and clean

### Success Criteria

✅ Document names appear as visual badges  
✅ No layout issues or overlapping  
✅ Immediately updates after document upload  
✅ Works with multiple documents  
✅ Clean and professional appearance  
