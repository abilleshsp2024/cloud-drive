import { API_URL } from '../config';

import React, { useState, useEffect, useRef } from 'react';
import { User, DriveItem, FileType } from '../types';
import {
  Folder, File, Plus, Search, LogOut, Grid, List,
  ChevronRight, HardDrive, Clock, Star, Trash2,
  Upload, MoreVertical, Download, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(user.parentId || null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize data from API
  useEffect(() => {
    fetchItems();
  }, [user.id, activeFolderId]);

  const fetchItems = async () => {
    const token = localStorage.getItem('drive_token');
    try {
      const parentQuery = activeFolderId ? `&parentId=${activeFolderId}` : '';
      const res = await fetch(`${API_URL}/api/drive?ownerId=${user.id}${parentQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch items');
      const data = await res.json();
      setItems(data);
    } catch (error) {
      toast.error('Failed to load files');
    }
  };

  const createFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    const token = localStorage.getItem('drive_token');
    try {
      const res = await fetch('${API_URL}/api/drive/folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: folderName,
          parentId: activeFolderId,
          ownerId: user.id
        })
      });

      if (!res.ok) throw new Error('Failed to create folder');
      const newItem = await res.json();
      setItems([...items, newItem]);
      toast.success('Folder created successfully');
    } catch (error) {
      toast.error('Could not create folder');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    simulateUpload(files[0]);
  };

  const simulateUpload = async (file: File) => {
    if (isUploading) return;
    setIsUploading(true);
    setUploadProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);

      if (progress >= 90) {
        clearInterval(interval);
        finalizeUpload(file);
      }
    }, 200);
  };

  const finalizeUpload = async (file: File) => {
    const token = localStorage.getItem('drive_token');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ownerId', user.id);
      if (activeFolderId) {
        formData.append('parentId', activeFolderId);
      } else {
        formData.append('parentId', 'null');
      }

      const res = await fetch('${API_URL}/api/drive/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      const newItem = await res.json();

      setItems(prev => [...prev, newItem]);
      setIsUploading(false);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
      toast.success('File uploaded successfully');
    } catch (error) {
      setIsUploading(false);
      toast.error('Upload failed');
    }
  };

  const deleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const token = localStorage.getItem('drive_token');
      try {
        const res = await fetch(`${API_URL}/api/drive/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Delete failed');

        setItems(items.filter(item => item.id !== id));
        toast.success('Item deleted');
      } catch (error) {
        toast.error('Could not delete item');
      }
    }
  };

  const currentItems = items.filter(item => item.parentId === activeFolderId);
  const breadcrumbs = [];
  let tempId = activeFolderId;
  while (tempId) {
    const folder = items.find(i => i.id === tempId);
    if (folder) {
      breadcrumbs.unshift(folder);
      tempId = folder.parentId;
    } else break;
  }

  const handleView = async (item: DriveItem) => {
    console.log("View clicked for item:", item);
    if (item.s3Url) {
      // Try to get a signed URL first
      try {
        const token = localStorage.getItem('drive_token');
        console.log("Fetching presigned URL...");
        const res = await fetch(`${API_URL}/api/drive/file/${item.id}/view`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Response status:", res.status);
        if (res.ok) {
          const data = await res.json();
          console.log("Got signed URL:", data.url);
          window.open(data.url, '_blank');
          return;
        } else {
          console.error("Failed to get signed URL, status:", res.status);
          const err = await res.text();
          console.error("Error body:", err);
        }
      } catch (e) {
        console.error("Failed to get signed URL exception", e);
      }

      // Fallback (though likely to fail for private buckets)
      console.log("Falling back to direct S3 URL:", item.s3Url);
      window.open(item.s3Url, '_blank');
    } else {
      toast.error('File URL not available');
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '--';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden text-[#3C4043]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 flex flex-none flex-col bg-white">
        <div className="p-4 mb-4">
          <div className="flex items-center gap-2 mb-8 px-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <HardDrive className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-medium tracking-tight">CloudDrive</span>
          </div>

          <button
            onClick={createFolder}
            className="flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg transition group active:scale-95"
          >
            <Plus className="text-blue-600" />
            <span className="font-medium text-sm">New Folder</span>
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-2">
          <NavItem icon={<Grid size={20} />} label="My Drive" active={activeFolderId === (user.parentId || null)} onClick={() => setActiveFolderId(user.parentId || null)} />
          <NavItem icon={<Clock size={20} />} label="Recent" />
          <NavItem icon={<Star size={20} />} label="Starred" />
          <NavItem icon={<Trash2 size={20} />} label="Trash" />
        </nav>

        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Storage</span>
            <span className="text-xs text-gray-500">24% used</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-blue-600 w-[24%]"></div>
          </div>
          <p className="text-[10px] text-gray-500">3.6 GB of 15 GB used</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 flex-none">
          <div className="flex-1 max-w-2xl relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search in Drive"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-100 transition outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-4 ml-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-500">{user.username}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Dashboard Tools */}
        <div className="h-14 border-b border-gray-200 px-6 flex items-center justify-between bg-white flex-none">
          <div className="flex items-center text-sm font-medium overflow-hidden">
            <button
              onClick={() => setActiveFolderId(user.parentId || null)}
              className="hover:bg-gray-100 px-2 py-1 rounded transition"
            >
              My Drive
            </button>
            {breadcrumbs.map(f => (
              <React.Fragment key={f.id}>
                <ChevronRight size={16} className="text-gray-400 mx-1" />
                <button
                  onClick={() => setActiveFolderId(f.id)}
                  className="hover:bg-gray-100 px-2 py-1 rounded transition truncate max-w-[150px]"
                >
                  {f.name}
                </button>
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition"
            >
              <Upload size={18} />
              <span>Upload File</span>
            </button>
            <div className="w-px h-6 bg-gray-200 mx-2"></div>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* File Area */}
        <div
          className="flex-1 overflow-y-auto p-6"
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files?.[0]) {
              simulateUpload(e.dataTransfer.files[0]);
            }
          }}
        >
          {isUploading && (
            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-700">Uploading to S3...</span>
                <span className="text-sm font-medium text-blue-700">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {currentItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
              <div className="bg-gray-100 p-8 rounded-full mb-4">
                <HardDrive size={64} strokeWidth={1} />
              </div>
              <p className="text-lg">No files or folders here</p>
              <p className="text-sm">Drag and drop files to upload to S3</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {currentItems.map(item => (
                <FileGridItem
                  key={item.id}
                  item={item}
                  onOpen={() => item.type === 'folder' ? setActiveFolderId(item.id) : handleView(item)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Owner</th>
                    <th className="px-6 py-3">Last Modified</th>
                    <th className="px-6 py-3 text-right">Size</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map(item => (
                    <FileListItem
                      key={item.id}
                      item={item}
                      onOpen={() => item.type === 'folder' ? setActiveFolderId(item.id) : handleView(item)}
                      onView={() => handleView(item)}
                      onDelete={() => deleteItem(item.id)}
                      formatSize={formatSize}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-2 text-sm font-medium rounded-r-full transition ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const FileGridItem: React.FC<{ item: DriveItem, onOpen: () => void, onDelete: () => void }> = ({ item, onOpen, onDelete }) => (
  <div
    className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition cursor-pointer select-none"
    onDoubleClick={onOpen}
  >
    <div className="flex justify-between items-start mb-3">
      {item.type === 'folder' ? (
        <Folder className="text-blue-500 fill-blue-50" size={40} strokeWidth={1.5} />
      ) : item.type === 'image' ? (
        <div className="bg-orange-50 p-2 rounded-lg">
          <File className="text-orange-500" size={24} />
        </div>
      ) : (
        <div className="bg-blue-50 p-2 rounded-lg">
          <File className="text-blue-500" size={24} />
        </div>
      )}
      <div className="opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
    <p className="text-sm font-medium truncate mb-1" title={item.name}>{item.name}</p>
    <p className="text-[10px] text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</p>
  </div>
);

const FileListItem: React.FC<{ item: DriveItem, onOpen: () => void, onView: () => void, onDelete: () => void, formatSize: (b?: number) => string }> = ({ item, onOpen, onView, onDelete, formatSize }) => (
  <tr className="hover:bg-gray-50 transition cursor-pointer" onDoubleClick={onOpen}>
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        {item.type === 'folder' ? (
          <Folder size={18} className="text-blue-500 fill-blue-50" />
        ) : (
          <File size={18} className="text-gray-400" />
        )}
        <span className="font-medium text-gray-700">{item.name}</span>
      </div>
    </td>
    <td className="px-6 py-4 text-gray-500">me</td>
    <td className="px-6 py-4 text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</td>
    <td className="px-6 py-4 text-right text-gray-500">{item.type === 'folder' ? '--' : formatSize(item.size)}</td>
    <td className="px-6 py-4 text-right">
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 transition"
          title="View"
        >
          <Eye size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
          className="p-1.5 hover:bg-gray-100 rounded text-gray-400 transition"
          title="Download"
        >
          <Download size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </td>
  </tr>
);

