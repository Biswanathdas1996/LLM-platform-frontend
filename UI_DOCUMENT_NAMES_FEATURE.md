# Document Names Display in UI

## Overview
Added visual display of document names in the BYOD (Bring Your Own Data) page's "Manage Indexes" tab.

## What Changed

### Frontend Updates

#### 1. Schema Update (`shared/schema.ts`)
Added `documents` field to `RAGIndex` interface:
```typescript
export interface RAGIndex {
  name: string;
  created_at: string;
  stats: {
    total_documents: number;
    total_chunks: number;
    total_size: number;
  };
  documents: string[]; // 🆕 Array of document filenames in this index
}
```

#### 2. UI Update (`client/src/pages/BYOD.tsx`)
Enhanced the "Existing Indexes" section to display document names as badges:

**Before:**
```
Index Name: medical
2 docs | 15 chunks | 1.2 KB
[Delete Button]
```

**After:**
```
Index Name: medical
2 docs | 15 chunks | 1.2 KB

Documents:
[📄 patient_records.txt] [📄 treatment_guidelines.pdf]
[Delete Button]
```

## Visual Features

### Document Badges
- Each document name is displayed as a badge with a file icon
- Badges use outline variant for clean, subtle appearance
- File icon (FileText) precedes each document name
- Badges wrap automatically if there are many documents
- Clean spacing between badges for readability

### Layout
- Documents section appears below the stats row
- Separated with proper margin for visual hierarchy
- Uses small, muted text label "Documents:"
- Flex wrap layout handles any number of documents gracefully

## UI Components Used
- `Badge` - For document name display
- `FileText` icon - Visual indicator for each document
- Flex wrap layout - Responsive document list

## Code Example

```tsx
{index.documents && index.documents.length > 0 && (
  <div className="mt-3 space-y-1">
    <p className="text-xs font-medium text-muted-foreground">Documents:</p>
    <div className="flex flex-wrap gap-1">
      {index.documents.map((docName, idx) => (
        <Badge 
          key={idx} 
          variant="outline" 
          className="text-xs"
          data-testid={`doc-${index.name}-${idx}`}
        >
          <FileText className="w-3 h-3 mr-1" />
          {docName}
        </Badge>
      ))}
    </div>
  </div>
)}
```

## User Flow

1. **Navigate to BYOD Page**
   - Click "BYOD - Bring Your Own Data" in navigation

2. **Go to Manage Indexes Tab**
   - Click the "Manage Indexes" tab (database icon)

3. **View Index Documents**
   - Scroll through existing indexes
   - See document names displayed as badges under each index
   - Quickly identify which documents are in which index

## Benefits

✅ **Immediate Visibility**: See all documents in an index at a glance  
✅ **Better Organization**: Understand index contents without API calls  
✅ **User-Friendly**: Visual badges are more appealing than plain text  
✅ **No Extra Clicks**: Information is displayed inline  
✅ **Responsive Design**: Works on all screen sizes  
✅ **Accessible**: Includes proper test IDs for testing  

## Testing

### Test IDs Added
- `doc-{indexName}-{documentIndex}` - For each document badge

### Manual Testing Steps
1. Start the application
2. Navigate to BYOD page
3. Create an index (e.g., "medical")
4. Upload some documents to the index
5. Go to "Manage Indexes" tab
6. Verify documents appear as badges below the index stats

### Automated Testing
Can verify using test IDs:
```typescript
// Check that medical index shows its documents
cy.get('[data-testid="doc-medical-0"]').should('contain', 'patient_records.txt');
cy.get('[data-testid="doc-medical-1"]').should('contain', 'treatment_guidelines.pdf');
```

## Example Screenshots (Text Description)

### Empty Index
```
┌─────────────────────────────────────────┐
│ technology                              │
│ 0 docs | 0 chunks | 0.0 KB      [🗑️]   │
└─────────────────────────────────────────┘
```

### Index with Documents
```
┌─────────────────────────────────────────┐
│ medical                                 │
│ 2 docs | 15 chunks | 1.2 KB             │
│                                         │
│ Documents:                              │
│ [📄 patient_records.txt]                │
│ [📄 treatment_guidelines.pdf]     [🗑️]  │
└─────────────────────────────────────────┘
```

### Index with Many Documents
```
┌─────────────────────────────────────────┐
│ research                                │
│ 5 docs | 45 chunks | 8.7 KB             │
│                                         │
│ Documents:                              │
│ [📄 paper1.pdf] [📄 paper2.pdf]         │
│ [📄 notes.txt] [📄 results.csv]         │
│ [📄 analysis.docx]              [🗑️]    │
└─────────────────────────────────────────┘
```

## API Integration

The UI automatically fetches and displays documents from the backend API:

**Request:**
```
GET /api/rag/indexes
```

**Response:**
```json
{
  "indexes": [
    {
      "name": "medical",
      "created_at": "2025-10-18T12:22:14",
      "stats": {
        "total_documents": 2,
        "total_chunks": 15,
        "total_size": 1024
      },
      "documents": [
        "patient_records.txt",
        "treatment_guidelines.pdf"
      ]
    }
  ]
}
```

## Future Enhancements

Potential improvements:
1. **Document Actions**: Click badge to view/delete individual documents
2. **Tooltips**: Hover to see document metadata (size, chunks, upload date)
3. **Sorting**: Sort documents by name, size, or date
4. **Filtering**: Filter/search documents within an index
5. **Icons**: Different icons for different file types (.pdf, .txt, .docx)
6. **Color Coding**: Visual indication of document size or chunk count
7. **Download**: Option to download original documents

## Compatibility

- ✅ Works with existing backend API
- ✅ No breaking changes
- ✅ Gracefully handles empty document lists
- ✅ Responsive on mobile and desktop
- ✅ Compatible with all modern browsers
