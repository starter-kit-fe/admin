import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DictData } from '@/app/dashboard/system/dict/type';
import { DictDataTable } from '../dict-data-table';

describe('DictDataTable actions', () => {
  const baseRow: DictData = {
    dictCode: 1,
    dictLabel: '状态-启用',
    dictValue: 'enabled',
    dictSort: 1,
    status: '0',
    cssClass: '',
    listClass: '',
    isDefault: 'N',
    dictType: 'system_status',
    remark: '用于测试',
  };

  it('prevents bubbling when opening the action menu', async () => {
    const user = userEvent.setup();
    const wrapperClick = vi.fn();

    render(
      <div data-testid="wrapper" onClick={wrapperClick}>
        <DictDataTable
          rows={[baseRow]}
          isLoading={false}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </div>,
    );

    const trigger = screen.getByRole('button', { name: /更多操作/ });
    await user.click(trigger);

    expect(wrapperClick).not.toHaveBeenCalled();
  });

  it('calls edit/delete callbacks from dropdown menu items', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <DictDataTable
        rows={[baseRow]}
        isLoading={false}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    const trigger = screen.getByRole('button', { name: /更多操作/ });
    await user.click(trigger);

    const editItem = await screen.findByRole('menuitem', { name: /编辑/ });
    await user.click(editItem);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining(baseRow));

    const deleteItem = await screen.findByRole('menuitem', { name: /删除/ });
    await user.click(deleteItem);
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining(baseRow));
  });
});
