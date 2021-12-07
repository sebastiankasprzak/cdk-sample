profile=awsdataeng

synth:
	cdk synth

nag: synth
	cfn_nag_scan --input-path cdk.out --deny-list-path .cfnnag-suppress -t ".*\.template\.json"

deploy:
	AWS_PROFILE=${profile} cdk deploy
