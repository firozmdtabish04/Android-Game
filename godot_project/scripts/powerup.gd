extends Area3D

## MITTI RUN - Power-Up Collectible
## Supports: Magnet, Suraksha Shield, Speed Boost

@export_enum("magnet", "shield", "boost") var powerup_type: String = "magnet"
@export var duration: float = 10.0

var bob_timer: float = 0.0
var base_y: float = 0.0

func _ready() -> void:
	base_y = position.y
	body_entered.connect(_on_body_entered)

func _process(delta: float) -> void:
	rotate_y(2.5 * delta)
	bob_timer += delta * 4.0
	position.y = base_y + sin(bob_timer) * 0.2

func _on_body_entered(body: Node3D) -> void:
	if body.has_method("handle_obstacle_hit"):
		match powerup_type:
			"magnet":
				GameManager.activate_magnet(duration)
			"shield":
				GameManager.activate_shield()
			"boost":
				GameManager.activate_boost(duration)
				
		var tween = create_tween()
		tween.tween_property(self, "scale", scale * 1.8, 0.1)
		tween.tween_property(self, "scale", Vector3.ZERO, 0.1)
		tween.tween_callback(queue_free)
