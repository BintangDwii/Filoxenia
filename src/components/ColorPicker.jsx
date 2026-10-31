import { COLOR_OPTIONS } from '../data/constants.js';

const ColorPicker = ({ selected, onSelect }) => (
  <div className="flex flex-wrap gap-2 pt-1">
    {COLOR_OPTIONS.map((color) => (
      <button
        key={color.name}
        type="button"
        title={color.name}
        aria-label={`Pilih warna ${color.name}`}
        onClick={() => onSelect(color.name)}
        className={`w-6 h-6 rounded-full border shadow-sm transition-all ${
          selected === color.name
            ? 'border-[#44A6F1] ring-2 ring-[#44A6F1]/40 scale-110'
            : 'border-gray-300 hover:scale-110 hover:border-gray-400'
        }`}
        style={{ backgroundColor: color.hex }}
      ></button>
    ))}
  </div>
);

export default ColorPicker;
