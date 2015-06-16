Date.prototype.formatMmSs = function(){
	return stringify(this.getMinutes()) + ":" + stringify(this.getSeconds());

	function stringify(st){
		if(st.toString().length==1){ return "0" + st; }
		return st;
	}
}

function Square(x,y, $parent){
	this.x = x;
	this.y = y;
	this.value =  "";
	this.exposed = false;
	flagged = false;
	this.$square = $("<div></div>").addClass('square btn btn-default')
		.attr({'data-x': this.x, 'data-y': this.y})
		.appendTo($parent);
}
Square.prototype.expose = function(){
	if(!this.exposed){
		this.$square.addClass('revealed').removeClass('btn-default')
		.text(this.value);
		if(this.value == "m"){
			game.end(false);
			this.$square.addClass('btn-danger');
		}
		(this.flagged) ? this.flag('exposed') : null;
		this.exposed = true;
		game.revealed = (game.revealed >= game.goal-1) ? game.end(true) : game.revealed+1;
		if(this.value == ""){
			this.exposeNeighbors();
		}
	}
}
Square.prototype.exposeNeighbors = function(){
		var toDo = gameBoard.getNeighbors(this.x, this.y);
		for(var i=0;i<toDo.length;i++){
			var ref= gameBoard.arr[toDo[i][1]][toDo[i][0]];
			ref.expose();
		}
}
Square.prototype.tryToMine = function(){
	if(this.value != 'm'){
		this.value = 'm';
		return true;
	}
	return false;
}
Square.prototype.tryToIncrement = function(){
	if(this.value != 'm'){
		this.value++;
		return true;
	}
	return false;
}
Square.prototype.flag = function(exposed){
	if(!this.exposed){
		this.$square.toggleClass('flag').toggleClass('btn-default');
		this.flagged = !this.flagged;
		if(exposed){ this.$square.removeClass('btn-default'); }
	}
}

var gameBoard={
	width: 10,
	height: 10,
	arr: [],
	$board: $("#gameBoard"),

	init: function(){
		for(var y=0;y<this.height;y++){
			this.arr[y] = new Array();
			var $row =  $('<div></div>')
			.addClass('rw-' + y)
			.appendTo(this.$board);
			for(var x=0;x<this.width;x++){
				this.arr[y][x] = new Square(x, y, $row);
			}
		}
	},
	clear: function(){
		this.arr=[];
		this.$board.empty();
	},
	getNeighbors: function(x,y){
		var neighborsArr = [];
		for(var row=y-1;row<=y+1;row++){
			for(var col=x-1;col<=x+1;col++){
				if(row>=0 && row <gameBoard.height && col>=0 &&col<gameBoard.width && !(row==y && col==x)){ //{TODO} better if
					neighborsArr[neighborsArr.length] = new Array();
					neighborsArr[neighborsArr.length-1] = [col,row];
				}
			}
		}
		return neighborsArr;
	},
	revealMines: function(){
		for(var y=0;y<this.height;y++){
			for(var x=0;x<this.width;x++){
				var ref = this.arr[y][x];
				if(ref.value=="m"){
					ref.$square.addClass('btn-danger').removeClass('flag btn-default').text("m");
				}
			}
		}
	}
};

var game = {
	mines: 10,
	revealed: 0,
	startedAt: null,
	gameTimer: null,
	plantMines: function(){
		var countMines = this.mines;
		while(countMines>0){
			var x = Math.floor(Math.random()*gameBoard.width);
			var y = Math.floor(Math.random()*gameBoard.height);
			if(gameBoard.arr[y][x].tryToMine()){
				countMines--;
				game.numberize(x,y);
			}
		}
	},
	numberize: function(x,y){
		var toDo = gameBoard.getNeighbors(x,y);
		for(var i=0;i<toDo.length;i++){
			gameBoard.arr[toDo[i][1]][toDo[i][0]].tryToIncrement();
		}
	},
	init: function(){
		gameBoard.$board.off('.playing', '.square');
		this.goal = gameBoard.width*gameBoard.height-this.mines;
		this.revealed = 0;
		gameBoard.$board.on('mouseup.playing', '.square', function(e){
			var x = $(this).attr('data-x');
			var y = $(this).attr('data-y');
			sq = gameBoard.arr[y][x];
			if(e.which==1){
				(sq.flagged) ? null : sq.expose();
			} else {
				sq.flag();
			}
		});
		this.initTiming();
	},
	initTiming: function(){
		this.stopTiming();
		this.startedAt = new Date();
		this.gameTimer=setInterval(function(){gameController.timing()},1000);
	},
	stopTiming: function(){
				clearInterval(this.gameTimer);
	},
	end: function(isWon){
		gameBoard.$board.off('.playing', '.square');
		this.stopTiming()
		gameBoard.revealMines();
		(isWon) ? $('.result .btn-success').fadeIn(500) : $('.result .btn-warning').fadeIn(500);
	},
}

var gameController = {
	init: function(){
		$('#settings-mines').val(game.mines);
		$('#settings-width').val(gameBoard.width);
		$('#settings-height').val(gameBoard.height);

		$('#newGame').on('click', function(){
			gameBoard.clear();
			gameBoard.init();
			game.init();
			game.plantMines();
			$('.result div').hide();
		});
		$('#applySettings').on('click', function(){
			gameController.changeSettings();
		});
	},
	changeSettings: function(){
		var mines = $('#settings-mines').val();
		var width = $('#settings-width').val();
		var height = $('#settings-height').val();
		if(mines>1 && mines<=120 && width>5 && width<=40 && height>5 && height<=40 && width*height>mines){
			game.mines = mines; gameBoard.width = width; gameBoard.height = height;
			$('#gameBoard').css({"width": 4+(width*20), "height": 4+(height*20)})
			$('#settingsModal').modal('hide');
			$('#newGame').trigger('click');
		} else {
			alert('I cant do  that');
		}
	},
	timing: function() {
	    var now = new Date();
	    var t = new Date(now-game.startedAt);
	    $('#time').text(t.formatMmSs());
	}
}
$(document).ready(function(){
	gameController.init();
    document.oncontextmenu = function() {return false;}; // Disable right click default
});