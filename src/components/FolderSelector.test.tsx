import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FolderSelector from './FolderSelector';

describe('FolderSelector', () => {
  const mockOnFolderSelected = vi.fn();
  const mockDirectoryHandle = {} as FileSystemDirectoryHandle;

  beforeEach(() => {
    // File System Access API をサポートしているとモック
    Object.defineProperty(window, 'showDirectoryPicker', {
      writable: true,
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('タイトルと説明が表示される', () => {
      render(<FolderSelector onFolderSelected={mockOnFolderSelected} />);

      expect(screen.getByText('Select React Project Folder')).toBeInTheDocument();
      expect(screen.getByText(/Choose a folder containing your React project/)).toBeInTheDocument();
    });

    it('フォルダ選択ボタンが表示される', () => {
      render(<FolderSelector onFolderSelected={mockOnFolderSelected} />);

      expect(screen.getByText('Select Folder')).toBeInTheDocument();
    });

    it('初期状態ではエラーが表示されない', () => {
      render(<FolderSelector onFolderSelected={mockOnFolderSelected} />);

      const errorElement = screen.queryByText(/Failed to select folder/);
      expect(errorElement).not.toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    it('isLoadingがtrueの場合、ボタンが無効化される', () => {
      render(<FolderSelector onFolderSelected={mockOnFolderSelected} isLoading={true} />);

      const button = screen.getByText('Analyzing...');
      expect(button).toBeDisabled();
    });

    it('isLoadingがtrueの場合、ボタンのテキストが変わる', () => {
      render(<FolderSelector onFolderSelected={mockOnFolderSelected} isLoading={true} />);

      expect(screen.getByText('Analyzing...')).toBeInTheDocument();
      expect(screen.queryByText('Select Folder')).not.toBeInTheDocument();
    });

    it('isLoadingがfalseの場合、ボタンが有効', () => {
      render(<FolderSelector onFolderSelected={mockOnFolderSelected} isLoading={false} />);

      const button = screen.getByText('Select Folder');
      expect(button).not.toBeDisabled();
    });
  });

  describe('フォルダ選択機能', () => {
    it('フォルダが選択されるとonFolderSelectedが呼ばれる', async () => {
      const mockShowDirectoryPicker = vi.fn().mockResolvedValue(mockDirectoryHandle);
      window.showDirectoryPicker = mockShowDirectoryPicker;

      render(<FolderSelector onFolderSelected={mockOnFolderSelected} />);

      const button = screen.getByText('Select Folder');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockShowDirectoryPicker).toHaveBeenCalledWith({ mode: 'read' });
        expect(mockOnFolderSelected).toHaveBeenCalledWith(mockDirectoryHandle);
      });
    });

    it('ユーザーがキャンセルした場合、エラーが表示されない', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      const mockShowDirectoryPicker = vi.fn().mockRejectedValue(abortError);
      window.showDirectoryPicker = mockShowDirectoryPicker;

      render(<FolderSelector onFolderSelected={mockOnFolderSelected} />);

      const button = screen.getByText('Select Folder');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockShowDirectoryPicker).toHaveBeenCalled();
      });

      // エラーメッセージが表示されないことを確認
      expect(screen.queryByText(/Failed to select folder/)).not.toBeInTheDocument();
      expect(mockOnFolderSelected).not.toHaveBeenCalled();
    });

    it('エラーが発生した場合、エラーメッセージが表示される', async () => {
      const mockError = new Error('Permission denied');
      const mockShowDirectoryPicker = vi.fn().mockRejectedValue(mockError);
      window.showDirectoryPicker = mockShowDirectoryPicker;

      render(<FolderSelector onFolderSelected={mockOnFolderSelected} />);

      const button = screen.getByText('Select Folder');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Failed to select folder: Permission denied/)).toBeInTheDocument();
      });

      expect(mockOnFolderSelected).not.toHaveBeenCalled();
    });
  });

  describe('ブラウザサポート', () => {
    it('File System Access APIがサポートされていない場合、警告が表示される', async () => {
      // showDirectoryPicker を削除してサポートされていない状態をシミュレート
      delete (window as Window & { showDirectoryPicker?: unknown }).showDirectoryPicker;

      render(<FolderSelector onFolderSelected={mockOnFolderSelected} />);

      await waitFor(() => {
        expect(screen.getByText('Browser Not Supported')).toBeInTheDocument();
        expect(screen.getByText(/Please use a modern Chromium-based browser/)).toBeInTheDocument();
      });
    });

    it('APIがサポートされていない場合、ボタンが無効化される', async () => {
      delete (window as Window & { showDirectoryPicker?: unknown }).showDirectoryPicker;

      render(<FolderSelector onFolderSelected={mockOnFolderSelected} />);

      await waitFor(() => {
        const button = screen.getByText('Select Folder');
        expect(button).toBeDisabled();
      });
    });

    it('APIがサポートされていない状態では警告メッセージが既に表示されている', async () => {
      delete (window as Window & { showDirectoryPicker?: unknown }).showDirectoryPicker;

      render(<FolderSelector onFolderSelected={mockOnFolderSelected} />);

      // ボタンが無効化されることを確認
      await waitFor(() => {
        const button = screen.getByText('Select Folder');
        expect(button).toBeDisabled();
      });

      // 警告メッセージが表示されていることを確認（ブラウザサポートのテストで既に確認済み）
      expect(screen.getByText('Browser Not Supported')).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('エラーが表示された後、再度選択を試みるとエラーがクリアされる', async () => {
      const mockError = new Error('First error');
      const mockShowDirectoryPicker = vi
        .fn()
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockDirectoryHandle);
      window.showDirectoryPicker = mockShowDirectoryPicker;

      render(<FolderSelector onFolderSelected={mockOnFolderSelected} />);

      const button = screen.getByText('Select Folder');

      // 最初のクリック - エラーが発生
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Failed to select folder: First error/)).toBeInTheDocument();
      });

      // 2回目のクリック - 成功
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnFolderSelected).toHaveBeenCalledWith(mockDirectoryHandle);
      });

      // エラーメッセージが消えることを確認
      expect(screen.queryByText(/Failed to select folder: First error/)).not.toBeInTheDocument();
    });
  });

  describe('統合シナリオ', () => {
    it('サポートされているブラウザで正常に動作する', async () => {
      const mockShowDirectoryPicker = vi.fn().mockResolvedValue(mockDirectoryHandle);
      window.showDirectoryPicker = mockShowDirectoryPicker;

      render(<FolderSelector onFolderSelected={mockOnFolderSelected} />);

      // タイトルとボタンが表示される
      expect(screen.getByText('Select React Project Folder')).toBeInTheDocument();
      const button = screen.getByText('Select Folder');
      expect(button).not.toBeDisabled();

      // ボタンをクリック
      fireEvent.click(button);

      // 正常に選択される
      await waitFor(() => {
        expect(mockOnFolderSelected).toHaveBeenCalledWith(mockDirectoryHandle);
      });

      // エラーメッセージは表示されない
      expect(screen.queryByText(/Failed to select folder/)).not.toBeInTheDocument();
    });
  });
});
