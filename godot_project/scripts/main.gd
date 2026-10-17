extends Node3D

## MITTI RUN - Main Scene Controller
## Coordinates World, Camera follow, Spawner, and UI switching.

@onready var camera: Camera3D = $Camera3D
@onready var player: CharacterBody3D = $Player
@onready var track_spawner: Node3D = $TrackSpawner

@onready var main_menu: Control = $CanvasLayer/MainMenu
@onready var hud: Control = $CanvasLayer/HUD
@onready var shop: Control = $CanvasLayer/Shop
@onready var game_over: Control = $CanvasLayer/GameOver

var camera_offset: Vector3 = Vector3(0, 3.8, 6.2)
var camera_smooth_speed: float = 12.0

func _ready() -> void:
	GameManager.game_state_changed.connect(_on_game_state_changed)
	
	if main_menu.has_signal("open_shop_requested"):
		main_menu.open_shop_requested.connect(_open_shop)
	if shop.has_signal("shop_closed"):
		shop.shop_closed.connect(_close_shop)
		
	# Initial UI state
	_update_ui_state(GameManager.current_state)

func _process(delta: float) -> void:
	if is_instance_valid(player) and is_instance_valid(camera):
		# Camera follows player Z and smoothly lerps X
		var target_pos = player.global_position + camera_offset
		camera.global_position.z = target_pos.z
		camera.global_position.x = lerp(camera.global_position.x, target_pos.x * 0.7, camera_smooth_speed * delta)
		camera.global_position.y = lerp(camera.global_position.y, target_pos.y, camera_smooth_speed * delta)

func _on_game_state_changed(new_state: int) -> void:
	_update_ui_state(new_state)

func _update_ui_state(state: int) -> void:
	main_menu.visible = (state == GameManager.GameState.MENU)
	hud.visible = (state == GameManager.GameState.PLAYING or state == GameManager.GameState.PAUSED)
	shop.visible = false
	
	if state == GameManager.GameState.GAME_OVER:
		if game_over.has_method("show_game_over"):
			game_over.show_game_over()
		else:
			game_over.visible = true
	else:
		game_over.visible = false

func _open_shop() -> void:
	main_menu.visible = false
	shop.visible = true
	if shop.has_method("refresh_shop"):
		shop.refresh_shop()

func _close_shop() -> void:
	shop.visible = false
	main_menu.visible = true
	if main_menu.has_method("update_display"):
		main_menu.update_display()
	if player and player.has_method("_apply_character_skin"):
		player._apply_character_skin()
