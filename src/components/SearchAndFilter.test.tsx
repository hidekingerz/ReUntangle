import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchAndFilter from './SearchAndFilter';
import type { SearchOptions, FilterOptions } from '@/types';

describe('SearchAndFilter', () => {
  const mockOnSearchChange = vi.fn();
  const mockOnFilterChange = vi.fn();

  const defaultSearchOptions: SearchOptions = {
    query: '',
    searchIn: 'both',
    useRegex: false,
  };

  const defaultFilterOptions: FilterOptions = {
    complexityRange: { min: 0, max: 100 },
    depthRange: { min: 0, max: 100 },
    componentTypes: [],
    fileExtensions: [],
    showUnused: true,
    showCircular: true,
  };

  const mockStats = {
    total: 100,
    filtered: 75,
    hidden: 25,
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本レンダリング', () => {
    it('検索入力フィールドが表示される', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      expect(screen.getByPlaceholderText('Search components by name or path...')).toBeInTheDocument();
    });

    it('統計情報が表示される', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('/ 100')).toBeInTheDocument();
      expect(screen.getByText('(25 hidden)')).toBeInTheDocument();
    });

    it('初期状態ではフィルターパネルが非表示', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      expect(screen.queryByText('Complexity Range')).not.toBeInTheDocument();
      expect(screen.getByText('▼ Show Filters')).toBeInTheDocument();
    });
  });

  describe('検索機能', () => {
    it('検索クエリの入力でonSearchChangeが呼ばれる', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      const input = screen.getByPlaceholderText('Search components by name or path...');
      fireEvent.change(input, { target: { value: 'Button' } });

      expect(mockOnSearchChange).toHaveBeenCalledWith({
        ...defaultSearchOptions,
        query: 'Button',
      });
    });

    it('検索範囲の変更でonSearchChangeが呼ばれる', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      const select = screen.getByDisplayValue('Name & Path');
      fireEvent.change(select, { target: { value: 'name' } });

      expect(mockOnSearchChange).toHaveBeenCalledWith({
        ...defaultSearchOptions,
        searchIn: 'name',
      });
    });

    it('正規表現チェックボックスの変更でonSearchChangeが呼ばれる', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      const checkbox = screen.getByLabelText('Regex');
      fireEvent.click(checkbox);

      expect(mockOnSearchChange).toHaveBeenCalledWith({
        ...defaultSearchOptions,
        useRegex: true,
      });
    });
  });

  describe('フィルターの展開/折りたたみ', () => {
    it('Show Filtersボタンをクリックするとフィルターが表示される', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      const toggleButton = screen.getByText('▼ Show Filters');
      fireEvent.click(toggleButton);

      expect(screen.getByText('Complexity Range')).toBeInTheDocument();
      expect(screen.getByText('Component Types')).toBeInTheDocument();
      expect(screen.getByText('File Extensions')).toBeInTheDocument();
      expect(screen.getByText('▲ Hide Filters')).toBeInTheDocument();
    });

    it('Hide Filtersボタンをクリックするとフィルターが非表示になる', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      const showButton = screen.getByText('▼ Show Filters');
      fireEvent.click(showButton);

      const hideButton = screen.getByText('▲ Hide Filters');
      fireEvent.click(hideButton);

      expect(screen.queryByText('Complexity Range')).not.toBeInTheDocument();
      expect(screen.getByText('▼ Show Filters')).toBeInTheDocument();
    });
  });

  describe('複雑度フィルター', () => {
    it('複雑度の最小値変更でonFilterChangeが呼ばれる', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      fireEvent.click(screen.getByText('▼ Show Filters'));

      const minSlider = screen.getAllByRole('slider')[0];
      fireEvent.change(minSlider, { target: { value: '20' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilterOptions,
        complexityRange: { min: 20, max: 100 },
      });
    });

    it('複雑度の最大値変更でonFilterChangeが呼ばれる', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      fireEvent.click(screen.getByText('▼ Show Filters'));

      const maxSlider = screen.getAllByRole('slider')[1];
      fireEvent.change(maxSlider, { target: { value: '80' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilterOptions,
        complexityRange: { min: 0, max: 80 },
      });
    });
  });

  describe('コンポーネントタイプフィルター', () => {
    it('コンポーネントタイプのチェックボックスが表示される', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      fireEvent.click(screen.getByText('▼ Show Filters'));

      expect(screen.getByText('function')).toBeInTheDocument();
      expect(screen.getByText('class')).toBeInTheDocument();
      expect(screen.getByText('arrow')).toBeInTheDocument();
      expect(screen.getByText('hook')).toBeInTheDocument();
    });

    it('タイプを選択するとonFilterChangeが呼ばれる', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      fireEvent.click(screen.getByText('▼ Show Filters'));

      const functionCheckbox = screen.getByLabelText('function');
      fireEvent.click(functionCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilterOptions,
        componentTypes: ['function'],
      });
    });

    it('選択済みのタイプを解除するとonFilterChangeが呼ばれる', () => {
      const filterWithTypes: FilterOptions = {
        ...defaultFilterOptions,
        componentTypes: ['function', 'class'],
      };

      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={filterWithTypes}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      fireEvent.click(screen.getByText('▼ Show Filters'));

      const functionCheckbox = screen.getByLabelText('function');
      fireEvent.click(functionCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...filterWithTypes,
        componentTypes: ['class'],
      });
    });
  });

  describe('ファイル拡張子フィルター', () => {
    it('ファイル拡張子のチェックボックスが表示される', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      fireEvent.click(screen.getByText('▼ Show Filters'));

      expect(screen.getByText('.tsx')).toBeInTheDocument();
      expect(screen.getByText('.jsx')).toBeInTheDocument();
      expect(screen.getByText('.ts')).toBeInTheDocument();
      expect(screen.getByText('.js')).toBeInTheDocument();
    });

    it('拡張子を選択するとonFilterChangeが呼ばれる', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      fireEvent.click(screen.getByText('▼ Show Filters'));

      const tsxCheckbox = screen.getByLabelText('.tsx');
      fireEvent.click(tsxCheckbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilterOptions,
        fileExtensions: ['.tsx'],
      });
    });
  });

  describe('表示オプション', () => {
    it('未使用コンポーネントの表示切り替えが機能する', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      fireEvent.click(screen.getByText('▼ Show Filters'));

      const checkbox = screen.getByLabelText('Show Unused Components');
      fireEvent.click(checkbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilterOptions,
        showUnused: false,
      });
    });

    it('循環依存の表示切り替えが機能する', () => {
      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      fireEvent.click(screen.getByText('▼ Show Filters'));

      const checkbox = screen.getByLabelText('Show Circular Dependencies');
      fireEvent.click(checkbox);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...defaultFilterOptions,
        showCircular: false,
      });
    });
  });

  describe('フィルターのリセット', () => {
    it('Reset All Filtersボタンをクリックするとすべてがリセットされる', () => {
      const customSearch: SearchOptions = {
        query: 'test',
        searchIn: 'name',
        useRegex: true,
      };

      const customFilter: FilterOptions = {
        complexityRange: { min: 20, max: 80 },
        depthRange: { min: 2, max: 8 },
        componentTypes: ['function', 'hook'],
        fileExtensions: ['.tsx', '.ts'],
        showUnused: false,
        showCircular: false,
      };

      render(
        <SearchAndFilter
          searchOptions={customSearch}
          filterOptions={customFilter}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={mockStats}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      fireEvent.click(screen.getByText('▼ Show Filters'));

      const resetButton = screen.getByText('Reset All Filters');
      fireEvent.click(resetButton);

      expect(mockOnSearchChange).toHaveBeenCalledWith({
        query: '',
        searchIn: 'both',
        useRegex: false,
      });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        complexityRange: { min: 0, max: 100 },
        depthRange: { min: 0, max: 10 },
        componentTypes: [],
        fileExtensions: [],
        showUnused: true,
        showCircular: true,
      });
    });
  });

  describe('統計表示', () => {
    it('非表示のアイテムがない場合、hiddenテキストが表示されない', () => {
      const statsWithoutHidden = {
        total: 100,
        filtered: 100,
        hidden: 0,
      };

      render(
        <SearchAndFilter
          searchOptions={defaultSearchOptions}
          filterOptions={defaultFilterOptions}
          onSearchChange={mockOnSearchChange}
          onFilterChange={mockOnFilterChange}
          stats={statsWithoutHidden}
          maxComplexity={100}
          maxDepth={10}
        />
      );

      expect(screen.queryByText(/hidden/)).not.toBeInTheDocument();
    });
  });
});
