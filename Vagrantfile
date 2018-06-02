
Vagrant.configure(2) do |config|
  config.vm.box = "bento/ubuntu-17.10"
  
  config.vm.network :forwarded_port, guest: 80, host: 8080

  config.vm.provision 'ansible' do |ansible|
    ansible.playbook = 'provision/playbook.yml'
    ansible.verbose = 'v'
    ansible.extra_vars = {
      ansible_python_interpreter: '/usr/bin/python3',
      target: 'local'
    }
  end
end
