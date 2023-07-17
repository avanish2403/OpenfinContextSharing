import { Allotment } from 'allotment';
import 'allotment/dist/style.css';

const PopupWindow = () => {
  return (
    <Allotment vertical={true} data-testid="allotment-component">
      <Allotment.Pane>
        <div className="heading">
          <h1>Sample Popup</h1>
          <div>
            <p>This is a same popup</p>
          </div>
        </div>
      </Allotment.Pane>
    </Allotment>
  );
};
export default PopupWindow;
