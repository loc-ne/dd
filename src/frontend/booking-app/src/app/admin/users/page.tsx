'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';
import {
  Users,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  Trash2,
  Eye,
  X,
  CheckCircle,
  Clock,
  Shield,
  Building,
  Mail,
  Phone,
  Calendar,
  AlertTriangle,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

// Types
interface User {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  isHost: boolean;
  isAdmin: boolean;
  isActive: boolean;
  lockReason: string | null;
  createdAt: string;
  updatedAt: string;
}

type FilterType = 'all' | 'active' | 'locked' | 'host' | 'pending';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const itemsPerPage = 10;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (search?: string) => {
    setLoading(true);
    try {
      const url = search
        ? `${API_URL}/users?search=${encodeURIComponent(search)}`
        : `${API_URL}/users`;

      const response = await fetch(url, {
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let result = users;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.fullName.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.phoneNumber?.includes(query)
      );
    }

    // Apply filter
    switch (filterType) {
      case 'active':
        result = result.filter((u) => u.isActive && !u.lockReason);
        break;
      case 'locked':
        result = result.filter((u) => u.lockReason);
        break;
      case 'host':
        result = result.filter((u) => u.isHost);
        break;
      case 'pending':
        result = result.filter((u) => !u.isActive && !u.lockReason);
        break;
    }

    return result;
  }, [users, searchQuery, filterType]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.isActive && !u.lockReason).length,
    locked: users.filter((u) => u.lockReason).length,
    hosts: users.filter((u) => u.isHost).length,
    pending: users.filter((u) => !u.isActive && !u.lockReason).length,
  }), [users]);

  // Actions
  const handleLockUser = async () => {
    if (!selectedUser || !lockReason.trim()) {
      toast.error('Vui lòng nhập lý do khóa tài khoản');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${selectedUser.id}/lock`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: lockReason }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Đã khóa tài khoản thành công');
        setShowLockModal(false);
        setLockReason('');
        fetchUsers();
      } else {
        toast.error(result.message || 'Không thể khóa tài khoản');
      }
    } catch (error) {
      toast.error('Lỗi kết nối server');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlockUser = async (user: User) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${user.id}/unlock`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Đã mở khóa tài khoản');
        fetchUsers();
      } else {
        toast.error(result.message || 'Không thể mở khóa');
      }
    } catch (error) {
      toast.error('Lỗi kết nối server');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Đã xóa tài khoản');
        setShowDeleteModal(false);
        fetchUsers();
      } else {
        toast.error(result.message || 'Không thể xóa tài khoản');
      }
    } catch (error) {
      toast.error('Lỗi kết nối server');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(searchQuery);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                Quản lý người dùng
              </h1>
              <p className="text-slate-500 mt-1">Quản lý tất cả tài khoản trong hệ thống</p>
            </div>
            <button
              onClick={() => fetchUsers()}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Tổng cộng"
            value={stats.total}
            icon={Users}
            active={filterType === 'all'}
            onClick={() => { setFilterType('all'); setCurrentPage(1); }}
          />
          <StatCard
            label="Hoạt động"
            value={stats.active}
            icon={UserCheck}
            color="emerald"
            active={filterType === 'active'}
            onClick={() => { setFilterType('active'); setCurrentPage(1); }}
          />
          <StatCard
            label="Bị khóa"
            value={stats.locked}
            icon={Lock}
            color="red"
            active={filterType === 'locked'}
            onClick={() => { setFilterType('locked'); setCurrentPage(1); }}
          />
          <StatCard
            label="Chủ nhà"
            value={stats.hosts}
            icon={Building}
            color="blue"
            active={filterType === 'host'}
            onClick={() => { setFilterType('host'); setCurrentPage(1); }}
          />
          <StatCard
            label="Chưa xác thực"
            value={stats.pending}
            icon={Clock}
            color="amber"
            active={filterType === 'pending'}
            onClick={() => { setFilterType('pending'); setCurrentPage(1); }}
          />
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-slate-500">Đang tải...</p>
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="p-12 text-center">
              <UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Không tìm thấy người dùng</p>
              <p className="text-sm text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Người dùng</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide hidden md:table-cell">Liên hệ</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Vai trò</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Trạng thái</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide hidden lg:table-cell">Ngày tạo</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                user.fullName?.charAt(0)?.toUpperCase() || '?'
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{user.fullName}</p>
                              <p className="text-sm text-slate-500 truncate md:hidden">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="space-y-1">
                            <p className="text-sm text-slate-600 flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-400" />
                              {user.email}
                            </p>
                            {user.phoneNumber && (
                              <p className="text-sm text-slate-600 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-400" />
                                {user.phoneNumber}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {user.isAdmin && (
                              <span className="
    inline-flex items-center px-2.5 py-0.5
    rounded-md
    text-xs font-semibold
    border border-red-400/40
    bg-red-50
    text-red-700
  ">
                                Admin
                              </span>
                            )}

                            {user.isHost && (
                              <span className="
    inline-flex items-center px-2.5 py-0.5
    rounded-md
    text-xs font-semibold
    border border-blue-400/40
    bg-blue-50
    text-blue-700
  ">
                                Host
                              </span>
                            )}

                            {!user.isAdmin && !user.isHost && (
                              <span className="
    inline-flex items-center px-2.5 py-0.5
    rounded-md
    text-xs font-medium
    border border-gray-300
    bg-gray-50
    text-gray-600
  ">
                                User
                              </span>
                            )}

                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.lockReason ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              <Lock className="w-3 h-3" /> Đã khóa
                            </span>
                          ) : user.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              <CheckCircle className="w-3 h-3" /> Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              <Clock className="w-3 h-3" /> Chưa xác thực
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <p className="text-sm text-slate-600">
                            {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: vi })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setSelectedUser(user); setShowDetailModal(true); }}
                              className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {!user.isAdmin && (
                              <>
                                {user.lockReason ? (
                                  <button
                                    onClick={() => handleUnlockUser(user)}
                                    className="p-2 hover:bg-emerald-100 rounded-lg transition text-emerald-600"
                                    title="Mở khóa"
                                  >
                                    <Unlock className="w-5 h-5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => { setSelectedUser(user); setShowLockModal(true); }}
                                    className="p-2 hover:bg-amber-100 rounded-lg transition text-amber-600"
                                    title="Khóa tài khoản"
                                  >
                                    <Lock className="w-5 h-5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                                  className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
                                  title="Xóa tài khoản"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} / {filteredUsers.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-3 py-1 text-sm font-medium text-slate-700">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <Modal onClose={() => setShowDetailModal(false)}>
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Chi tiết người dùng</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                {selectedUser.avatarUrl ? (
                  <img src={selectedUser.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  selectedUser.fullName?.charAt(0)?.toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{selectedUser.fullName}</h3>
                <div className="flex gap-2 mt-1">
                  {selectedUser.isAdmin && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">Admin</span>
                  )}
                  {selectedUser.isHost && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Host</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <InfoRow icon={Mail} label="Email" value={selectedUser.email} />
              <InfoRow icon={Phone} label="Số điện thoại" value={selectedUser.phoneNumber || 'Chưa cập nhật'} />
              <InfoRow icon={Calendar} label="Ngày tạo" value={format(new Date(selectedUser.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })} />
              <InfoRow
                icon={selectedUser.lockReason ? Lock : CheckCircle}
                label="Trạng thái"
                value={selectedUser.lockReason ? 'Đã khóa' : selectedUser.isActive ? 'Hoạt động' : 'Chưa xác thực'}
                valueColor={selectedUser.lockReason ? 'text-red-600' : selectedUser.isActive ? 'text-emerald-600' : 'text-amber-600'}
              />
              {selectedUser.lockReason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-medium text-red-800 mb-1">Lý do khóa:</p>
                  <p className="text-sm text-red-700">{selectedUser.lockReason}</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Lock Modal */}
      {showLockModal && selectedUser && (
        <Modal onClose={() => setShowLockModal(false)}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Khóa tài khoản</h2>
                <p className="text-sm text-slate-500">{selectedUser.fullName}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Lý do khóa <span className="text-red-500">*</span>
              </label>
              <textarea
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                placeholder="Nhập lý do khóa tài khoản..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLockModal(false)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleLockUser}
                disabled={actionLoading || !lockReason.trim()}
                className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận khóa'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Xóa tài khoản</h2>
                <p className="text-sm text-slate-500">{selectedUser.fullName}</p>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <p className="text-sm text-red-800">
                <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác. Tất cả dữ liệu của người dùng sẽ bị xóa vĩnh viễn.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Components
function StatCard({
  label,
  value,
  icon: Icon,
  color = 'slate',
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color?: 'slate' | 'emerald' | 'red' | 'blue' | 'amber';
  active: boolean;
  onClick: () => void;
}) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 transition text-left w-full ${active
        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
        : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-600 mt-1">{label}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </button>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  valueColor = 'text-slate-900'
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className={`text-sm font-semibold truncate ${valueColor}`}>{value}</p>
      </div>
    </div>
  );
}
