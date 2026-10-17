extends Control

## MITTI RUN - Gameplay HUD

@onready var score_label: Label = $TopBar/ScoreBox/ScoreLabel
@onready var distance_label: Label = $TopBar/DistanceBox/DistanceLabel
@onready var coins_label: Label = $TopBar/CoinsBox/CoinsLabel
@onready var pause_btn: Button = $TopBar/PauseButton
@onready var magnet_bar: ProgressBar = $PowerupsContainer/MagnetBar
@onready var boost_bar: ProgressBar = $PowerupsContainer/BoostBar
@onready var shield_icon: TextureRect = $PowerupsContainer/ShieldIcon

func _ready() -> void:
	GameManager.score_updated.connect(_on_score_updated)
	GameManager.distance_updated.connect(_on_distance_updated)
	GameManager.coins_updated.connect(_on_coins_updated)
	GameManager.powerup_started.connect(_on_powerup_started)
	GameManager.powerup_ended.connect(_on_powerup_ended)
	
	if pause_btn:
		pause_btn.pressed.connect(_on_pause_pressed)
		
	if magnet_bar: magnet_bar.visible = false
	if boost_bar: boost_bar.visible = false
	if shield_icon: shield_icon.visible = false

func _process(_delta: float) -> void:
	if GameManager.magnet_timer > 0.0 and magnet_bar:
		magnet_bar.value = GameManager.magnet_timer / 10.0 * 100.0
	if GameManager.boost_timer > 0.0 and boost_bar:
		boost_bar.value = GameManager.boost_timer / 6.0 * 100.0

func _on_score_updated(score: int) -> void:
	if score_label:
		score_label.text = str(score)

func _on_distance_updated(dist: float) -> void:
	if distance_label:
		if dist >= 1000.0:
			distance_label.text = "%.2f KM" % (dist / 1000.0)
		else:
			distance_label.text = "%d M" % int(dist)

func _on_coins_updated(run_c: int, _total_c: int) -> void:
	if coins_label:
		coins_label.text = "₹ " + str(run_c)

func _on_powerup_started(type: String, _duration: float) -> void:
	match type:
		"magnet":
			if magnet_bar: magnet_bar.visible = true
		"boost":
			if boost_bar: boost_bar.visible = true
		"shield":
			if shield_icon: shield_icon.visible = true

func _on_powerup_ended(type: String) -> void:
	match type:
		"magnet":
			if magnet_bar: magnet_bar.visible = false
		"boost":
			if boost_bar: boost_bar.visible = false
		"shield":
			if shield_icon: shield_icon.visible = false

func _on_pause_pressed() -> void:
	AudioManager.play_click()
	GameManager.pause_game()
