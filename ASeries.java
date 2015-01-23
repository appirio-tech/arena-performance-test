import java.util.*;
public class ASeries {
  public int longest(int[] values) {
    Arrays.sort(values);
    int res =-1;
    for (int i = 0; i < values.length; i++)  {
      for (int j = i+1; j < values.length; j++)  {
        int d = values[j] - values[i];
        int c = 0;
        for (int k = j+1; k < values.length; k++)  if (values[k] == values[j]+(1+c)*d)  c++;
        res = Math.max(res, c);
      };
    };
    return res+2;
  }
 
}
 
// Powered by PopsEdit