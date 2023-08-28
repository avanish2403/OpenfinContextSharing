const PopupWindow = () => {
  const finWindow = fin.Window.getCurrentSync();
  finWindow.addListener('close-requested', function (event) {
    // alert('close requested');
    finWindow.close(true);
  });
  return (
    <div className="heading">
      <h1>Sample Popup</h1>
      <div>
        <p>This is a same popup</p>
      </div>
    </div>
  );
};
export default PopupWindow;
