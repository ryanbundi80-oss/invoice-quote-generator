import { Plus, Trash2 } from 'lucide-react';
import { formatMoney } from '../utils/format';

export default function LineItems({ items, currency, onChangeItem, onAddItem, onRemoveItem }) {
  return (
    <div className="line-items">
      <div className="items-grid items-head">
        <span>Description</span>
        <span>Qty</span>
        <span>Unit price</span>
        <span>Amount</span>
        <span />
      </div>

      {items.map((item, index) => {
        const amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

        return (
          <div className="items-grid item-row" key={item.id}>
            <input
              value={item.description}
              onChange={(event) => onChangeItem(index, 'description', event.target.value)}
              placeholder="Website design, logo package, consulting..."
              maxLength={240}
              autoComplete="off"
            />
            <input
              value={item.quantity}
              onChange={(event) => onChangeItem(index, 'quantity', event.target.value)}
              type="number"
              min="0"
              max="100000"
              step="1"
            />
            <input
              value={item.unitPrice}
              onChange={(event) => onChangeItem(index, 'unitPrice', event.target.value)}
              type="number"
              min="0"
              max="999999999"
              step="0.01"
            />
            <div className="amount-cell">{formatMoney(amount, currency)}</div>
            <button
              className="icon-button danger"
              type="button"
              onClick={() => onRemoveItem(index)}
              aria-label="Remove line item"
              disabled={items.length === 1}
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}

      <button className="btn btn-ghost" type="button" onClick={onAddItem}>
        <Plus size={16} />
        Add line item
      </button>
    </div>
  );
}
