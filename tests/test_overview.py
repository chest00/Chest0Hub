import unittest
from admin.overview import build_overview

class OverviewTests(unittest.TestCase):
    def test_private_projection(self):
        registry={'ok':True,'projects':[{'project_id':'x','name':'Test','state':'stable','admin_visible':True,'local_status':'present','stable_version':'v1.0.0','integration_levels':['A'],'secret':'NE_PAS_EXPORTER'}, {'project_id':'private','admin_visible':False}]}
        result=build_overview(registry,[{'id':'x','state':'opérationnel','version':'1.0'}])
        self.assertTrue(result['ok'])
        self.assertEqual(result['count'],1)
        self.assertEqual(result['projects'][0]['runtime_state'],'opérationnel')
        self.assertNotIn('secret',str(result))
        self.assertNotIn('private',str(result))
    def test_failure_closed(self):
        self.assertFalse(build_overview({'ok':False},[])['ok'])
    def test_no_process(self):
        result=build_overview({'ok':True,'projects':[{'project_id':'x','admin_visible':True}]},[])
        self.assertEqual(result['projects'][0]['runtime_state'],'non_pilote')
