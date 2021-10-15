var wrapper = document.getElementById('wrapper');
var video = document.getElementById('video');
var shutterButton = document.getElementById("shutter-Button");
var canvas = document.getElementById('overlay');
var context = canvas.getContext('2d');// canvas の context の取得


var tigerStanp = new Image();
var stampNose = new Image();                            // 鼻のスタンプ画像を入れる Image オブジェクト
stampNose.src = "./img/nose.png";                             // 鼻のスタンプ画像のファイル名
tigerStanp.src = "./img/tigerFace.png";   

var constraints = {
  audio: false,
  video: {
    facingMode: 'environment'　//'user'でインカメ
  }
};
var track = new clm.tracker({
  useWebGL: true
});


function adjustVideo() {
  // 映像が画面幅いっぱいに表示されるように調整
  var ratio = window.innerWidth / video.videoWidth;

  video.width = window.innerWidth;
  video.height = video.videoHeight * ratio;
  canvas.width = video.width;
  canvas.height = video.height;
}

//トラッキングとイラストの描画
function startTracking() {
  // トラッキング開始
  track.start(video);
  drawLoop();
}

// スタンプを描く 関数
// (顔部品の位置データ, 画像, 基準位置, 大きさ, 横シフト, 縦シフト)
function drawStamp(pos, img, bNo, scale, hShift, vShift) {
  var eyes = pos[32][0] - pos[27][0];                   // 幅の基準として両眼の間隔を求める
  var nose = pos[62][1] - pos[33][1];                   // 高さの基準として眉間と鼻先の間隔を求める
  var wScale = eyes / img.width;                        // 両眼の間隔をもとに画像のスケールを決める
  var imgW = img.width * scale * wScale;                // 画像の幅をスケーリング
  var imgH = img.height * scale * wScale;               // 画像の高さをスケーリング
  var imgL = pos[bNo][0] - imgW / 2 + eyes * hShift;    // 画像のLeftを決める
  var imgT = pos[bNo][1] - imgH / 2 + nose * vShift;    // 画像のTopを決める
  context.drawImage(img, imgL, imgT, imgW, imgH);       // 画像を描く
}

var imageData;
function drawLoop() {
  // 描画をクリア
  context.clearRect(0, 0, canvas.width, canvas.height);
  // videoをcanvasにトレース
  context.drawImage(video, 0, 0, canvas.width, canvas.height); 

  if (track.getCurrentPosition()) {
    // 顔のパーツの現在位置が存在

    var positions = track.getCurrentPosition();
    // console.log(positions);

    drawStamp(positions, tigerStanp, 25, 3.5, 0.3, -0.1);
    // track.draw(canvas);
  }
  requestAnimationFrame(drawLoop);
}



track.init(pModel);

// カメラから映像を取得
navigator.mediaDevices.getUserMedia(constraints)
  .then((stream) => {
    video.srcObject = stream;
    // 動画のメタ情報のロードが完了したら実行
    video.onloadedmetadata = function () {
      adjustVideo();
      startTracking();
    };
  })
  .catch((err) => {
    window.alert(err.name + ': ' + err.message);
});



// 撮影ボタン
function displaySnapshot() {
  var snapshot = new Image();

  snapshot.src = canvas.toDataURL('image/png');
  snapshot.onload = function () {
    snapshot.width = snapshot.width * 5/6;
    snapshot.height = snapshot.height * 5/6;

    //キャプチャ画像の表示
    wrapper.insertAdjacentHTML('afterbegin', '<div id="gallary"></div>');
    var gallary = document.getElementById('gallary');
    gallary.appendChild(snapshot);
    gallary.insertAdjacentHTML('beforeend', '<div id="gallary-ok" class="button">長押しで保存</div><button id="gallary-cancel" class="button">閉じる</button>');

    //閉じるボタン
    var gallaryCancel = document.getElementById('gallary-cancel');
    gallaryCancel.addEventListener('click', function () {
      gallary.remove();
    }, false);

  }
}

//撮影ボタン
shutterButton.addEventListener('click', displaySnapshot);



//カメラの切り替え
var chageCamera = document.getElementById('chageCamera');
var cameraFacing = false;

chageCamera.addEventListener('click', function(e){

    e.preventDefault();

    const mode = cameraFacing ? "environment" : "user";

    // インカメ時のミラー処理
    cameraFacing ? video.classList.remove('active') : video.classList.add('active');
    // canvasはAR.jsを使っている時
    cameraFacing ? canvas.classList.remove('active') : canvas.classList.add('active');

    // Android Chromeでは、セッションを一時停止しないとエラーが出ることがあるらしい
    stopStreamedVideo(video);

    // カメラ切り替え
    navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } })
            .then(stream => video.srcObject = stream)
            .catch(err => alert(`${err.name} ${err.message}`));

    cameraFacing = !cameraFacing;
});

// videoセッション一時停止
function stopStreamedVideo(videoElem) {
    let stream = videoElem.srcObject;
    let tracks = stream.getTracks();

    tracks.forEach(function(track) {
        track.stop();
    });

    videoElem.srcObject = null;
}


